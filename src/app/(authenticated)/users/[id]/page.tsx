import { notFound } from 'next/navigation';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { UserProfilePageUI } from './ui';

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const profilesQuery = new ProfilesQuery();
    const result = await profilesQuery.getUserById(id);

    if (!result.success) {
        notFound();
    }

    const user = result.data;

    return (
        <UserProfilePageUI
            user={user}
        />
    );
}
