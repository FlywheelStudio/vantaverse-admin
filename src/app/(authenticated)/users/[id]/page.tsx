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

    // Fetch user profile and appointments in parallel
    const [userResult, appointmentsResult] = await Promise.all([
        profilesQuery.getUserById(id),
        appointmentsQuery.getAppointmentsByUserId(id),
    ]);

    if (!userResult.success) {
        notFound();
    }

    const user = userResult.data;
    const appointments = appointmentsResult.success ? appointmentsResult.data : [];

    return (
        <UserProfilePageUI
            user={user}
            appointments={appointments}
        />
    );
}
