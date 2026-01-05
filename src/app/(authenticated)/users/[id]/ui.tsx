'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { UserProfileCard } from '@/components/users/user-profile-card';
import type { Profile } from '@/lib/supabase/schemas/profiles';
import type { Appointment } from '@/lib/supabase/queries/appointments';
import { AppointmentCard } from './appointment-card';
import { Card, CardContent } from '@/components/ui/card';

export function UserProfilePageUI({ user, appointments }: { user: Profile; appointments: Appointment[] }) {
    // Filter screening and consultation appointments
    const screeningAppointments = appointments.filter(a => a.type === 'onboarding_screening');
    const consultationAppointments = appointments.filter(a => a.type === 'onboarding_consultation');

    return (
        <PageWrapper
            subheader={<h1 className="text-2xl font-medium">{user.first_name && `${user.first_name}'s `}Profile</h1>}
        >
            <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background">
                <Card className="overflow-hidden shadow-xl bg-white dark:bg-background border border-border">
                    {/* User Profile Header */}
                    <div className="relative bg-linear-to-br from-blue-500/10 via-primary/5 to-transparent p-8 border-b border-white/10">
                        <UserProfileCard
                            userId={user.id}
                            firstName={user.first_name || ''}
                            lastName={user.last_name || ''}
                            email={user.email || ''}
                            avatarUrl={user.avatar_url}
                        />
                    </div>

                    {/* Appointment Cards Section */}
                    <CardContent className="p-8">
                        <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 sm:grid-cols-1 gap-4 items-start">
                            <AppointmentCard
                                title="Screening"
                                color="var(--color-blue-600)"
                                appointments={screeningAppointments}
                            />
                            <AppointmentCard
                                title="Consultation"
                                color="var(--color-green-600)"
                                appointments={consultationAppointments}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageWrapper >
    );
}