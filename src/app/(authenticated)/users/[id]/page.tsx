import { notFound, redirect } from 'next/navigation';
import { query, type DalResult, type QueryDef } from '@/lib/dal';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { getProfileByIdQuery } from '@/lib/supabase/queries/profiles';
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
import {
  getActiveProgramAssignmentByUserId,
  getProgramAssignmentComplianceByUserId,
} from '@/lib/supabase/queries/program-assignments';
import { getExerciseTemplatesByIds } from '@/lib/supabase/queries/exercise-templates';
import { getGroupsByIds } from '@/lib/supabase/queries/groups';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { mergeScheduleWithOverride } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import type { SupabaseError, SupabaseSuccess } from '@/lib/supabase/query';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
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

async function runSessionQuery<TArgs extends unknown[], TData>(
  def: QueryDef<TArgs, TData>,
  ...args: TArgs
): Promise<SupabaseSuccess<TData> | SupabaseError> {
  const result: DalResult<TData> = await queryWithSession(def, ...args);
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

function unwrapResult<T>(
  result: SupabaseSuccess<T> | SupabaseError,
  defaultValue: T,
): T {
  return result.success ? result.data : defaultValue;
}

async function fetchActiveProgramAssignmentData(
  userId: string,
): Promise<
  | SupabaseSuccess<{
      assignment: ProgramAssignmentWithTemplate | null;
      exerciseNamesMap: Map<string, string>;
      groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
    }>
  | SupabaseError
> {
  const assignmentResult = await runAdminQuery(
    getActiveProgramAssignmentByUserId,
    userId,
  );

  if (!assignmentResult.success) {
    return assignmentResult;
  }

  const assignment = assignmentResult.data;

  if (!assignment) {
    return {
      success: true,
      data: {
        assignment: null,
        exerciseNamesMap: new Map(),
        groupsMap: new Map(),
      },
    };
  }

  const workoutSchedule = assignment.workout_schedule;
  const exerciseTemplateIds =
    (workoutSchedule?.exercise_template_ids as string[] | null) ?? [];
  const groupIds = (workoutSchedule?.group_ids as string[] | null) ?? [];

  const [groupsResult, directTemplatesResult] = await Promise.all([
    groupIds.length > 0
      ? runAdminQuery(getGroupsByIds, groupIds)
      : Promise.resolve({ success: true as const, data: {} }),
    exerciseTemplateIds.length > 0
      ? runSessionQuery(getExerciseTemplatesByIds, exerciseTemplateIds)
      : Promise.resolve({ success: true as const, data: {} }),
  ]);

  const exerciseTemplateIdsFromGroups: string[] = [];
  const groupsMap = new Map<
    string,
    { exercise_template_ids: string[] | null }
  >();

  if (groupsResult.success) {
    for (const [groupId, group] of Object.entries(groupsResult.data)) {
      groupsMap.set(groupId, {
        exercise_template_ids: group.exercise_template_ids,
      });
      if (group.exercise_template_ids) {
        exerciseTemplateIdsFromGroups.push(...group.exercise_template_ids);
      }
    }
  }

  const exerciseNamesMap = new Map<string, string>();
  if (directTemplatesResult.success) {
    for (const [templateId, template] of Object.entries(
      directTemplatesResult.data,
    )) {
      if (template.exercise_name) {
        exerciseNamesMap.set(templateId, template.exercise_name);
      }
    }
  }

  const groupOnlyTemplateIds = [
    ...new Set(
      exerciseTemplateIdsFromGroups.filter((id) => !exerciseNamesMap.has(id)),
    ),
  ];

  if (groupOnlyTemplateIds.length > 0) {
    const groupTemplatesResult = await runSessionQuery(
      getExerciseTemplatesByIds,
      groupOnlyTemplateIds,
    );
    if (groupTemplatesResult.success) {
      for (const [templateId, template] of Object.entries(
        groupTemplatesResult.data,
      )) {
        if (template.exercise_name) {
          exerciseNamesMap.set(templateId, template.exercise_name);
        }
      }
    }
  }

  return {
    success: true,
    data: {
      assignment,
      exerciseNamesMap,
      groupsMap,
    },
  };
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const orgMembersQuery = new OrganizationMembers();

  const [profileErr, user] = await queryWithSession(getProfileByIdQuery, id);

  if (profileErr || !user) {
    const [, adminExists] = await queryWithSession(adminExistsQuery, id);
    if (adminExists) {
      redirect(`/manage/${id}`);
    }
    notFound();
  }

  const isPatient = user.role === 'patient';

  const [
    appointmentsResult,
    hpLevelThresholdResult,
    hpTransactionsResult,
    empowermentThresholdResult,
    gateInfoResult,
    ipTransactionsResult,
    nextThresholdResult,
    mcIntakeSurveyResult,
    habitPledgeResult,
    programAssignmentDataResult,
    complianceResult,
    patientOrganizationsResult,
  ] = await Promise.all([
    runAdminQuery(getAppointmentsByUserId, id),
    user.current_level !== null
      ? runAdminQuery(getHpLevelThresholdByLevel, user.current_level)
      : Promise.resolve({ success: true as const, data: null }),
    runAdminQuery(getHpTransactionsByUserId, id),
    user.empowerment_threshold !== null
      ? runAdminQuery(getEmpowermentThresholdById, user.empowerment_threshold)
      : Promise.resolve({ success: true as const, data: null }),
    user.max_gate_type !== null && user.max_gate_unlocked !== null
      ? runAdminQuery(
          getCurrentGateInfo,
          user.max_gate_type,
          user.max_gate_unlocked,
        )
      : Promise.resolve({ success: true as const, data: null }),
    runAdminQuery(getIpTransactionsByUserId, id),
    user.empowerment_threshold !== null
      ? runAdminQuery(
          getNextEmpowermentThreshold,
          user.empowerment_threshold,
        )
      : Promise.resolve({ success: true as const, data: null }),
    runAdminQuery(getSurveyByUserId, id),
    runAdminQuery(getPledgeByUserId, id),
    fetchActiveProgramAssignmentData(id),
    isPatient
      ? runSessionQuery(getProgramAssignmentComplianceByUserId, id)
      : Promise.resolve({ success: true as const, data: null }),
    isPatient
      ? orgMembersQuery.getOrganizationsByUserId(id)
      : Promise.resolve({ success: true as const, data: [] }),
  ]);

  const patientOrganizations = unwrapResult(patientOrganizationsResult, []).map(
    (o) => ({
      id: o.id,
      name: o.name,
      description: o.description,
    }),
  );

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

  const appointments = unwrapResult(appointmentsResult, []);
  const hpLevelThreshold = unwrapResult(hpLevelThresholdResult, null);
  const hpTransactions = unwrapResult(hpTransactionsResult, []);
  const empowermentThreshold = unwrapResult(empowermentThresholdResult, null);
  const gateInfo = unwrapResult(gateInfoResult, null);
  const ipTransactions = unwrapResult(ipTransactionsResult, []);
  const nextThreshold = unwrapResult(nextThresholdResult, null);
  const mcIntakeSurvey = unwrapResult(mcIntakeSurveyResult, null);
  const habitPledge = unwrapResult(habitPledgeResult, null);
  const programAssignmentData = unwrapResult(programAssignmentDataResult, null);
  const programAssignment = programAssignmentData?.assignment ?? null;
  const compliance = unwrapResult(complianceResult, null);
  const exerciseNamesMap =
    programAssignmentData?.exerciseNamesMap ?? new Map<string, string>();
  const groupsMap =
    programAssignmentData?.groupsMap ??
    new Map<string, { exercise_template_ids: string[] | null }>();

  let schedule: DatabaseSchedule | null = null;
  let completion: Array<Array<unknown>> | null | undefined = null;

  if (programAssignment) {
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

  let pointsMissingForNextLevel: number | null = null;
  if (user.empowerment !== null && nextThreshold !== null) {
    const currentEmpowerment = user.empowerment;
    const nextBasePower = nextThreshold.base_power;
    pointsMissingForNextLevel = Math.max(0, nextBasePower - currentEmpowerment);
  } else if (
    user.empowerment !== null &&
    empowermentThreshold &&
    empowermentThreshold.top_power < 999
  ) {
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
