'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { UserProfileCard } from '@/components/users/user-profile-card';
import type { Profile } from '@/lib/supabase/schemas/profiles';

export function UserProfilePageUI({ user }: { user: Profile }) {
    return (
        <PageWrapper
            subheader={<h1 className="text-2xl font-medium">{user.first_name && `${user.first_name}'s `}Profile</h1>}
        >
            <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background">
                <UserProfileCard
                    userId={user.id}
                    firstName={user.first_name || ''}
                    lastName={user.last_name || ''}
                    email={user.email || ''}
                    avatarUrl={user.avatar_url}
                />
            </div>
        </PageWrapper >
    );
}