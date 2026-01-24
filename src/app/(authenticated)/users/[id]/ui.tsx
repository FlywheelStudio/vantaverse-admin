'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { UserProfileCard } from '@/components/users/user-profile-card';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Appointment } from '@/lib/supabase/queries/appointments';
import type { McIntakeSurvey } from '@/lib/supabase/queries/mc-intake';
import type { HabitPledge } from '@/lib/supabase/queries/habit-pledge';
import { AppointmentCard } from './partials/appointment-card';
import { HpCard } from './partials/hp-card';
import { IpCard } from './partials/ip-card';
import { McIntakeCard } from './partials/mc-intake-card';
import { HabitPledgeCard } from './partials/habit-pledge-card';
import { ProgramStatusCard } from './program-status/card';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

export function UserProfilePageUI({
  user,
  appointments,
  hpLevelThreshold,
  hpTransactions,
  empowermentThreshold,
  gateInfo,
  ipTransactions,
  pointsMissingForNextLevel,
  mcIntakeSurvey,
  habitPledge,
  programAssignment,
  schedule,
  completion,
  exerciseNamesMap,
  groupsMap,
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
  mcIntakeSurvey: McIntakeSurvey | null;
  habitPledge: HabitPledge | null;
  programAssignment: ProgramAssignmentWithTemplate | null;
  schedule: DatabaseSchedule | null;
  completion: Array<Array<unknown>> | null | undefined;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
}) {
  // Filter screening and consultation appointments
  const screeningAppointments = appointments.filter(
    (a) => a.type === 'onboarding_screening',
  );
  const consultationAppointments = appointments.filter(
    (a) => a.type === 'onboarding_consultation',
  );

  const { user: currentUser } = useAuth();

  const isYourself = useMemo(
    () => user.id === currentUser?.id,
    [user.id, currentUser?.id],
  );

  // Determine if user is a member (patient) - physicians (admin) only see profile card
  const isMember = user.role === 'patient' || !user.role;

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">
          {isYourself
            ? 'Your '
            : `${user.first_name && `${user.first_name}'s `} `}
          Profile
        </h1>
      }
    >
      <Card className="overflow-hidden shadow-xl bg-white dark:bg-background border border-border">
        {/* User Profile Header */}
        <div className="relative bg-linear-to-br from-blue-500/10 via-primary/5 to-transparent p-8 border-b border-white/10">
          <UserProfileCard
            userId={user.id}
            firstName={user.first_name || ''}
            lastName={user.last_name || ''}
            description={user.description}
            email={user.email || ''}
            avatarUrl={user.avatar_url}
            role={user.role}
          />
        </div>

        {/* Cards Section - Only show for members, hide for physicians */}
        {isMember && (
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
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
              <McIntakeCard survey={mcIntakeSurvey} />
              <HabitPledgeCard pledge={habitPledge} />
            </div>
            <div className="col-span-full w-full mt-6">
              <ProgramStatusCard
                assignment={programAssignment}
                schedule={schedule}
                completion={completion}
                exerciseNamesMap={exerciseNamesMap}
                groupsMap={groupsMap}
                userId={user.id}
                userFirstName={user.first_name}
                userLastName={user.last_name}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </PageWrapper>
  );
}
