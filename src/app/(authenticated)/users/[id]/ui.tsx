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
import { GroupAssignmentCard } from './partials/group-assignment-card';
import { PhysicianAssignmentCard } from './partials/physician-assignment-card';
import { ProgramAssignmentCard } from './partials/program-assignment-card';
import { ProgramStatusCard } from './program-status/card';
import { ComplianceChartCard } from './partials/compliance-chart-card';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

export function UserProfilePageUI({
  user,
  organizations,
  physiologistsByOrgId,
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
  compliance,
  schedule,
  completion,
  exerciseNamesMap,
  groupsMap,
}: {
  user: ProfileWithStats;
  organizations?: Array<{ id: string; name: string; description: string | null }>;
  physiologistsByOrgId: Map<
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
  >;
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
  compliance: number | null;
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

  // Get physiologist for first organization (primary)
  const primaryPhysiologist =
    organizations && organizations.length > 0
      ? physiologistsByOrgId.get(organizations[0].id) ?? null
      : null;

  return (
    <PageWrapper
      subheader={
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          {isYourself
            ? 'Your '
            : `${user.first_name && `${user.first_name}'s `} `}
          Profile
        </h1>
      }
    >
      <Card className="border border-border shadow-[var(--shadow-lg)]">
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
            <div className="grid grid-cols-3 gap-6 items-stretch">
              {/* Left Column: Program Onboarding Progress (2/3 width) */}
              <div className="col-span-2 space-y-4 border border-primary/10 rounded-xl p-4 py-6 h-full">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Program Onboarding Progress
                </h2>
                <div className="space-y-4">
                  <AppointmentCard
                    title="1. Screening"
                    appointments={screeningAppointments}
                  />
                  <McIntakeCard survey={mcIntakeSurvey} />
                  <AppointmentCard
                    title="3. Virtual Consultation"
                    appointments={consultationAppointments}
                  />
                  <GroupAssignmentCard
                    organizations={organizations ?? []}
                    userId={user.id}
                    userFirstName={user.first_name}
                    userLastName={user.last_name}
                  />
                  <PhysicianAssignmentCard
                    physiologist={primaryPhysiologist}
                    organizations={organizations}
                  />
                  <ProgramAssignmentCard
                    assignment={programAssignment}
                    organizations={organizations}
                    userId={user.id}
                    userFirstName={user.first_name}
                    userLastName={user.last_name}
                  />
                </div>
              </div>

              {/* Right Column: VantaThrive Insights (1/3 width) */}
              <div className="col-span-1 space-y-4 border border-primary/10 rounded-xl p-4 py-6 h-full">
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  VantaThrive Insights
                </h2>
                <div className="space-y-4">
                  <ComplianceChartCard
                    compliance={compliance}
                    programAssignment={programAssignment}
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
                  <div className="grid grid-cols-2 gap-4 items-start">
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
                    <HabitPledgeCard pledge={habitPledge} />
                  </div>

                </div>
              </div>
            </div>

            {/* Program Status Card - Full width at bottom */}
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
