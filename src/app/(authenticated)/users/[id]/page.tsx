import { notFound, redirect } from 'next/navigation';
import { query, type DalResult, type QueryDef } from '@/lib/dal';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { adminExistsQuery } from '@/lib/supabase/queries/admins';
import { getAppointmentsByUserId } from '@/lib/supabase/queries/appointments';
import {
  getHpLevelThresholdByLevel,
  getHpTransactionsByUserId,
} from '@/lib/supabase/queries/hp-points';
import {
  getCurrentGateInfo,
  getEmpowermentThresholdById,
  getIpTransactionsByUserId,
  getNextEmpowermentThreshold,
} from '@/lib/supabase/queries/ip-points';
import { getSurveyByUserId } from '@/lib/supabase/queries/mc-intake';
import { getPledgeByUserId } from '@/lib/supabase/queries/habit-pledge';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { mergeScheduleWithOverride } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import {
  createParallelQueries,
  type SupabaseError,
  type SupabaseSuccess,
} from '@/lib/supabase/query';
import { UserProfilePageUI } from './ui';

async function runAdminQuery<TArgs extends unknown[], TData>(
  def: QueryDef<TArgs, TData>,
  ...args: TArgs
): Promise<SupabaseSuccess<TData> | SupabaseError> {
  const client = await createAdminClient();
  const result: DalResult<TData> = await query(def, ...args, { client });
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profilesQuery = new ProfilesQuery();
  const programAssignmentsQuery = new ProgramAssignmentsQuery();
  const orgMembersQuery = new OrganizationMembers();

  // Patient path: profiles / profiles_with_stats only.
  const userResult = await profilesQuery.getUserById(id);

  if (!userResult.success) {
    // Admin-only users live under /manage/[id].
    const [, adminExists] = await queryWithSession(adminExistsQuery, id);
    if (adminExists) {
      redirect(`/manage/${id}`);
    }
    notFound();
  }

  const user = userResult.data;
  
  // Bulk query remaining data in parallel
  const data = await createParallelQueries({
    appointments: {
      query: () => runAdminQuery(getAppointmentsByUserId, id),
      defaultValue: [],
    },
    hpLevelThreshold: {
      condition: user.current_level !== null,
      query: () =>
        runAdminQuery(getHpLevelThresholdByLevel, user.current_level!),
      defaultValue: null,
    },
    hpTransactions: {
      query: () => runAdminQuery(getHpTransactionsByUserId, id),
      defaultValue: [],
    },
    empowermentThreshold: {
      condition: user.empowerment_threshold !== null,
      query: () =>
        runAdminQuery(
          getEmpowermentThresholdById,
          user.empowerment_threshold!,
        ),
      defaultValue: null,
    },
    gateInfo: {
      condition:
        user.max_gate_type !== null && user.max_gate_unlocked !== null,
      query: () =>
        runAdminQuery(
          getCurrentGateInfo,
          user.max_gate_type!,
          user.max_gate_unlocked!,
        ),
      defaultValue: null,
    },
    ipTransactions: {
      query: () => runAdminQuery(getIpTransactionsByUserId, id),
      defaultValue: [],
    },
    nextThreshold: {
      condition: user.empowerment_threshold !== null,
      query: () =>
        runAdminQuery(
          getNextEmpowermentThreshold,
          user.empowerment_threshold!,
        ),
      defaultValue: null,
    },
    mcIntakeSurvey: {
      query: () => runAdminQuery(getSurveyByUserId, id),
      defaultValue: null,
    },
    habitPledge: {
      query: () => runAdminQuery(getPledgeByUserId, id),
      defaultValue: null,
    },
    programAssignmentData: {
      query: () => programAssignmentsQuery.getActiveByUserId(id),
      defaultValue: null,
    },
    compliance: {
      condition: user.role === 'patient',
      query: () => programAssignmentsQuery.getComplianceByUserId(id),
      defaultValue: null,
    },
    patientOrganizations: {
      condition: user.role === 'patient',
      query: () =>
        orgMembersQuery.getOrganizationsByUserId(id),
      defaultValue: [] as Array<{ id: string; name: string; description: string | null }>,
    },
  });

  const patientOrganizations = (data.patientOrganizations ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    description: o.description,
  }));

  // Fetch physiologists for each organization
  const physiologistsByOrgId = new Map<
    string,
    | {
        userId: string;
        firstName: string;
        lastName: string;
        email: string;
        avatarUrl: string | null;
        description: string | null;
      }
    | null
  >();

  if (patientOrganizations.length > 0) {
    const physiologistQueries = await Promise.all(
      patientOrganizations.map(async (org) => {
        const result = await orgMembersQuery.getCurrentPhysiologist(org.id);
        return {
          orgId: org.id,
          physiologist: result.success ? result.data : null,
        };
      }),
    );

    for (const { orgId, physiologist } of physiologistQueries) {
      physiologistsByOrgId.set(orgId, physiologist);
    }
  }

  const appointments = data.appointments;
  const hpLevelThreshold = data.hpLevelThreshold;
  const hpTransactions = data.hpTransactions;
  const empowermentThreshold = data.empowermentThreshold;
  const gateInfo = data.gateInfo;
  const ipTransactions = data.ipTransactions;
  const mcIntakeSurvey = data.mcIntakeSurvey;
  const habitPledge = data.habitPledge;
  const programAssignment = data.programAssignmentData?.assignment ?? null;
  const compliance = data.compliance ?? null;
  const exerciseNamesMap =
    data.programAssignmentData?.exerciseNamesMap ?? new Map<string, string>();
  const groupsMap =
    data.programAssignmentData?.groupsMap ??
    new Map<string, { exercise_template_ids: string[] | null }>();

  // Extract schedule and completion from program assignment
  let schedule: DatabaseSchedule | null = null;
  let completion: Array<Array<unknown>> | null | undefined = null;

  if (programAssignment) {
    // Extract schedule from workout_schedule, merge with patient_override if exists
    const baseSchedule = programAssignment.workout_schedule?.schedule as
      | DatabaseSchedule
      | null
      | undefined;
    const patientOverride = programAssignment.patient_override as
      | DatabaseSchedule
      | null
      | undefined;

    schedule = mergeScheduleWithOverride(
      baseSchedule ?? null,
      patientOverride ?? null,
    );
    completion = programAssignment.completion as
      | Array<Array<unknown>>
      | null
      | undefined;
  }

  // Calculate points missing for next level
  let pointsMissingForNextLevel: number | null = null;
  if (
    user.empowerment !== null &&
    data.nextThreshold !== null
  ) {
    const currentEmpowerment = user.empowerment;
    const nextBasePower = data.nextThreshold.base_power;
    pointsMissingForNextLevel = Math.max(0, nextBasePower - currentEmpowerment);
  } else if (
    user.empowerment !== null &&
    empowermentThreshold &&
    empowermentThreshold.top_power < 999
  ) {
    // If no next threshold but not at max, calculate based on current top_power
    pointsMissingForNextLevel = Math.max(
      0,
      empowermentThreshold.top_power - user.empowerment,
    );
  }

  return (
    <UserProfilePageUI
      user={user}
      organizations={patientOrganizations}
      physiologistsByOrgId={physiologistsByOrgId}
      appointments={appointments}
      hpLevelThreshold={hpLevelThreshold}
      hpTransactions={hpTransactions}
      empowermentThreshold={empowermentThreshold}
      gateInfo={gateInfo}
      ipTransactions={ipTransactions}
      pointsMissingForNextLevel={pointsMissingForNextLevel}
      mcIntakeSurvey={mcIntakeSurvey}
      habitPledge={habitPledge}
      programAssignment={programAssignment}
      compliance={compliance}
      schedule={schedule}
      completion={completion}
      exerciseNamesMap={exerciseNamesMap}
      groupsMap={groupsMap}
    />
  );
}
