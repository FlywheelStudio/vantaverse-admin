import { notFound } from 'next/navigation';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { AppointmentsQuery } from '@/lib/supabase/queries/appointments';
import { UserProfilePageUI } from './ui';

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const profilesQuery = new ProfilesQuery();
  const appointmentsQuery = new AppointmentsQuery();

  // First, validate that the user exists
  const userResult = await profilesQuery.getUserById(id);

  if (!userResult.success) {
    notFound();
  }

  const user = userResult.data;

  // Bulk query remaining data in parallel
  const [appointmentsResult, hpLevelThresholdResult, hpTransactionsResult] =
    await Promise.all([
      appointmentsQuery.getAppointmentsByUserId(id),
      user.current_level !== null
        ? profilesQuery.getHpLevelThresholdByLevel(user.current_level)
        : Promise.resolve({
            success: false,
            error: 'No current level',
          } as const),
      profilesQuery.getHpTransactionsByUserId(id),
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

  return (
    <UserProfilePageUI
      user={user}
      appointments={appointments}
      hpLevelThreshold={hpLevelThreshold}
      hpTransactions={hpTransactions}
    />
  );
}
