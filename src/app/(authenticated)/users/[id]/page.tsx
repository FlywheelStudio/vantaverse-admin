import { notFound } from 'next/navigation';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { AppointmentsQuery } from '@/lib/supabase/queries/appointments';
import { HpPointsQuery } from '@/lib/supabase/queries/hp-points';
import { IpPointsQuery } from '@/lib/supabase/queries/ip-points';
import { McIntakeQuery } from '@/lib/supabase/queries/mc-intake';
import { HabitPledgeQuery } from '@/lib/supabase/queries/habit-pledge';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { mergeScheduleWithOverride } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import { createParallelQueries } from '@/lib/supabase/query';
import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { UserProfilePageUI } from './ui';
import { AdminProfileView } from './admin-profile-view';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profilesQuery = new ProfilesQuery();
  const appointmentsQuery = new AppointmentsQuery();
  const hpPointsQuery = new HpPointsQuery();
  const ipPointsQuery = new IpPointsQuery();
  const mcIntakeQuery = new McIntakeQuery();
  const habitPledgeQuery = new HabitPledgeQuery();
  const programAssignmentsQuery = new ProgramAssignmentsQuery();

  // First, validate that the user exists
  const userResult = await profilesQuery.getUserById(id);

  if (!userResult.success) {
    notFound();
  }

  const user = userResult.data;

  // If target user is physician (admin role), show org tabs with viewing admin's organizations
  const isTargetUserPhysician = user.role === 'admin';

  // Parallelize admin-related queries
  const orgMembersQuery = new OrganizationMembers();
  const adminData = await createParallelQueries({
    currentUser: {
      query: () => getAuthProfile(),
      defaultValue: null,
    },
    organizations: {
      condition: isTargetUserPhysician,
      query: () => orgMembersQuery.getOrganizationsByUserId(id),
      defaultValue: [],
    },
  });

  const currentUserId = adminData.currentUser?.id ?? null;
  const organizations = Array.isArray(adminData.organizations)
    ? adminData.organizations.map((org) => ({
        ...org,
        is_active: null,
        is_super_admin: null,
        created_at: null,
        updated_at: null,
      }))
    : [];

  if (isTargetUserPhysician) {
    return (
      <AdminProfileView
        user={user}
        currentUserId={currentUserId}
        organizations={organizations}
      />
    );
  }
  
  // Bulk query remaining data in parallel
  const data = await createParallelQueries({
    appointments: {
      query: () => appointmentsQuery.getAppointmentsByUserId(id),
      defaultValue: [],
    },
    hpLevelThreshold: {
      condition: user.current_level !== null,
      query: () =>
        hpPointsQuery.getHpLevelThresholdByLevel(user.current_level!),
      defaultValue: null,
    },
    hpTransactions: {
      query: () => hpPointsQuery.getHpTransactionsByUserId(id),
      defaultValue: [],
    },
    empowermentThreshold: {
      condition: user.empowerment_threshold !== null,
      query: () =>
        ipPointsQuery.getEmpowermentThresholdById(user.empowerment_threshold!),
      defaultValue: null,
    },
    gateInfo: {
      condition:
        user.max_gate_type !== null && user.max_gate_unlocked !== null,
      query: () =>
        ipPointsQuery.getCurrentGateInfo(
          user.max_gate_type!,
          user.max_gate_unlocked!,
        ),
      defaultValue: null,
    },
    ipTransactions: {
      query: () => ipPointsQuery.getIpTransactionsByUserId(id),
      defaultValue: [],
    },
    nextThreshold: {
      condition: user.empowerment_threshold !== null,
      query: () =>
        ipPointsQuery.getNextEmpowermentThreshold(user.empowerment_threshold!),
      defaultValue: null,
    },
    mcIntakeSurvey: {
      query: () => mcIntakeQuery.getSurveyByUserId(id),
      defaultValue: null,
    },
    habitPledge: {
      query: () => habitPledgeQuery.getPledgeByUserId(id),
      defaultValue: null,
    },
    programAssignmentData: {
      query: () => programAssignmentsQuery.getActiveByUserId(id),
      defaultValue: null,
    },
    patientOrganizations: {
      condition: user.role === 'patient',
      query: () =>
        orgMembersQuery.getOrganizationsByUserId(id),
      defaultValue: [] as Array<{ id: string; name: string }>,
    },
  });

  const patientOrganizations = (data.patientOrganizations ?? []).map((o) => ({
    id: o.id,
    name: o.name,
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
      schedule={schedule}
      completion={completion}
      exerciseNamesMap={exerciseNamesMap}
      groupsMap={groupsMap}
    />
  );
}
