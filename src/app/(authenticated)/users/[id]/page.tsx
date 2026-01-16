import { notFound } from 'next/navigation';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { AppointmentsQuery } from '@/lib/supabase/queries/appointments';
import { HpPointsQuery } from '@/lib/supabase/queries/hp-points';
import { IpPointsQuery } from '@/lib/supabase/queries/ip-points';
import { McIntakeQuery } from '@/lib/supabase/queries/mc-intake';
import { HabitPledgeQuery } from '@/lib/supabase/queries/habit-pledge';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { mergeScheduleWithOverride } from '@/app/(authenticated)/builder/workout-schedule/utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/workout-schedule/utils';
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

  if (isTargetUserPhysician) {
    const orgMembersQuery = new OrganizationMembers();
    const organizationsResult = await orgMembersQuery.getOrganizationsByUserId(id);

    const organizations = organizationsResult.success
      ? organizationsResult.data
      : [];

    // Fetch patients for each organization
    type PatientData = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      avatar_url: string | null;
    };

    const patientsByOrg: Record<string, PatientData[]> = {};

    await Promise.all(
      organizations.map(async (org) => {
        const patientsResult =
          await profilesQuery.getPatientsByOrganization(org.id);
        if (patientsResult.success) {
          patientsByOrg[org.id] = patientsResult.data.map((p) => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            avatar_url: p.avatar_url,
          }));
        }
      }),
    );

    return (
      <AdminProfileView
        user={user}
        organizations={organizations}
        patientsByOrg={patientsByOrg}
      />
    );
  }
  
  // Bulk query remaining data in parallel
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
    programAssignmentResult,
  ] = await Promise.all([
    appointmentsQuery.getAppointmentsByUserId(id),
    user.current_level !== null
      ? hpPointsQuery.getHpLevelThresholdByLevel(user.current_level)
      : Promise.resolve({
          success: false,
          error: 'No current level',
        } as const),
    hpPointsQuery.getHpTransactionsByUserId(id),
    user.empowerment_threshold !== null
      ? ipPointsQuery.getEmpowermentThresholdById(user.empowerment_threshold)
      : Promise.resolve({
          success: false,
          error: 'No empowerment threshold',
        } as const),
    user.max_gate_type !== null && user.max_gate_unlocked !== null
      ? ipPointsQuery.getCurrentGateInfo(
          user.max_gate_type,
          user.max_gate_unlocked,
        )
      : Promise.resolve({
          success: false,
          error: 'No gate information',
        } as const),
    ipPointsQuery.getIpTransactionsByUserId(id),
    user.empowerment_threshold !== null
      ? ipPointsQuery.getNextEmpowermentThreshold(user.empowerment_threshold)
      : Promise.resolve({
          success: false,
          error: 'No current threshold',
        } as const),
    mcIntakeQuery.getSurveyByUserId(id),
    habitPledgeQuery.getPledgeByUserId(id),
    programAssignmentsQuery.getActiveByUserId(id),
  ]);

  const appointments = appointmentsResult.success
    ? appointmentsResult.data
    : [];
  const hpLevelThreshold = hpLevelThresholdResult.success
    ? hpLevelThresholdResult.data
    : null;
  const hpTransactions = hpTransactionsResult.success
    ? hpTransactionsResult.data
    : [];
  const empowermentThreshold = empowermentThresholdResult.success
    ? empowermentThresholdResult.data
    : null;
  const gateInfo = gateInfoResult.success ? gateInfoResult.data : null;
  const ipTransactions = ipTransactionsResult.success
    ? ipTransactionsResult.data
    : [];
  const mcIntakeSurvey = mcIntakeSurveyResult.success
    ? mcIntakeSurveyResult.data
    : null;
  const habitPledge = habitPledgeResult.success ? habitPledgeResult.data : null;
  const programAssignmentData = programAssignmentResult.success
    ? programAssignmentResult.data
    : null;
  const programAssignment = programAssignmentData?.assignment ?? null;
  const exerciseNamesMap =
    programAssignmentData?.exerciseNamesMap ?? new Map<string, string>();
  const groupsMap =
    programAssignmentData?.groupsMap ??
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
    nextThresholdResult.success &&
    nextThresholdResult.data !== null
  ) {
    const currentEmpowerment = user.empowerment;
    const nextBasePower = nextThresholdResult.data.base_power;
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
