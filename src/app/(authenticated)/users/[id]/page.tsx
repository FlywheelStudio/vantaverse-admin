import { notFound } from 'next/navigation';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { AppointmentsQuery } from '@/lib/supabase/queries/appointments';
import { HpPointsQuery } from '@/lib/supabase/queries/hp-points';
import { IpPointsQuery } from '@/lib/supabase/queries/ip-points';
import { McIntakeQuery } from '@/lib/supabase/queries/mc-intake';
import { HabitPledgeQuery } from '@/lib/supabase/queries/habit-pledge';
import { UserProfilePageUI } from './ui';

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

  // First, validate that the user exists
  const userResult = await profilesQuery.getUserById(id);

  if (!userResult.success) {
    notFound();
  }

  const user = userResult.data;

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
    />
  );
}
