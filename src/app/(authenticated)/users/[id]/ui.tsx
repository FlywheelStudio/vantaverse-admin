'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { UserProfileCard } from '@/components/users/user-profile-card';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Appointment } from '@/lib/supabase/queries/appointments';
import { AppointmentCard } from './appointment-card';
import { HpCard } from './hp-card';
import { IpCard } from './ip-card';
import { Card, CardContent } from '@/components/ui/card';

export function UserProfilePageUI({
  user,
  appointments,
  hpLevelThreshold,
  hpTransactions,
  empowermentThreshold,
  gateInfo,
  ipTransactions,
  pointsMissingForNextLevel,
}: {
  user: ProfileWithStats;
  appointments: Appointment[];
  hpLevelThreshold: {
    description: string;
    image_url: string | null;
  } | null;
  hpTransactions: Array<{
    created_at: string | null;
    points_earned: number;
    transaction_type: string;
    description: string | null;
  }>;
  empowermentThreshold: {
    title: string;
    base_power: number;
    top_power: number;
    effects: string | null;
  } | null;
  gateInfo: {
    title: string;
    description: string | null;
  } | null;
  ipTransactions: Array<{
    created_at: string | null;
    amount: number;
    transaction_type: string;
    description: string | null;
  }>;
  pointsMissingForNextLevel: number | null;
}) {
  // Filter screening and consultation appointments
  const screeningAppointments = appointments.filter(
    (a) => a.type === 'onboarding_screening',
  );
  const consultationAppointments = appointments.filter(
    (a) => a.type === 'onboarding_consultation',
  );

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">
          {user.first_name && `${user.first_name}'s `}Profile
        </h1>
      }
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

          {/* Cards Section */}
          <CardContent className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
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
              <HpCard
                currentLevel={user.current_level}
                hpPoints={user.hp_points}
                pointsRequiredForNextLevel={user.points_required_for_next_level}
                currentPhase={user.current_phase}
                levelDescription={hpLevelThreshold?.description ?? null}
                levelImageUrl={hpLevelThreshold?.image_url ?? null}
                transactions={hpTransactions}
              />
              <IpCard
                empowerment={user.empowerment}
                empowermentTitle={user.empowerment_title}
                currentEffect={empowermentThreshold?.effects ?? null}
                gateTitle={gateInfo?.title ?? null}
                gateDescription={gateInfo?.description ?? null}
                pointsMissingForNextLevel={pointsMissingForNextLevel}
                basePower={empowermentThreshold?.base_power ?? null}
                topPower={empowermentThreshold?.top_power ?? null}
                transactions={ipTransactions}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
