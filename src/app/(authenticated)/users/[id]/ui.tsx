'use client';

import { useMemo, useState } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';
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
import { ChangeOnboardingDialog } from './partials/change-onboarding-dialog';
import { MemberDetailHeader } from './partials/member-detail-header';
import { MemberNotesTab } from './partials/member-notes-tab';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

type MemberTab = 'onb' | 'prog' | 'notes';

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
}): React.ReactElement {
  const [activeTab, setActiveTab] = useState<MemberTab>('onb');
  const [changeOnboardingOpen, setChangeOnboardingOpen] = useState(false);

  const screeningAppointments = appointments.filter(
    (appointment) => appointment.type === 'onboarding_screening',
  );
  const consultationAppointments = appointments.filter(
    (appointment) => appointment.type === 'onboarding_consultation',
  );

  const isMember = user.role === 'patient' || !user.role;
  const displayName = useMemo(() => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Member';
  }, [user.first_name, user.last_name]);

  const primaryPhysiologist =
    organizations && organizations.length > 0
      ? physiologistsByOrgId.get(organizations[0].id) ?? null
      : null;

  const gateCount = Math.min(user.max_gate_unlocked ?? 0, 4);
  const isProgramOverdue =
    user.program_due_date != null &&
    new Date(user.program_due_date) < new Date() &&
    !programAssignment;

  const programTabBadge = programAssignment
    ? `week ${Math.max(1, Math.ceil((compliance ?? 0) / 12.5))} of ${programAssignment.program_template?.weeks ?? 8}`
    : isProgramOverdue
      ? 'overdue'
      : 'not assigned';

  if (!isMember) {
    return (
      <>
        <AppBar
          crumbs={[
            { label: 'Members', href: '/users' },
            { label: displayName },
          ]}
          title={displayName}
        />
        <div className="body">
          <MemberDetailHeader
            user={user}
            organizations={organizations}
            physiologist={
              primaryPhysiologist
                ? {
                    firstName: primaryPhysiologist.firstName,
                    lastName: primaryPhysiologist.lastName,
                  }
                : null
            }
            programAssignment={programAssignment}
            onChangeOnboarding={() => setChangeOnboardingOpen(true)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <AppBar
        crumbs={[
          { label: 'Members', href: '/users' },
          { label: displayName },
        ]}
        title={displayName}
      />
      <div className="body">
        <MemberDetailHeader
          user={user}
          organizations={organizations}
          physiologist={
            primaryPhysiologist
              ? {
                  firstName: primaryPhysiologist.firstName,
                  lastName: primaryPhysiologist.lastName,
                }
              : null
          }
          programAssignment={programAssignment}
          onChangeOnboarding={() => setChangeOnboardingOpen(true)}
        />

        <div className="tabs" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={activeTab === 'onb' ? 'on' : undefined}
            onClick={() => setActiveTab('onb')}
          >
            <Icon name="CircleDot" size={16} />
            Onboarding
          </button>
          <button
            type="button"
            className={activeTab === 'prog' ? 'on' : undefined}
            onClick={() => setActiveTab('prog')}
          >
            <Icon name="ClipboardList" size={16} />
            Program
            <span
              className="cnt"
              style={
                isProgramOverdue
                  ? { background: 'var(--danger-soft)', color: 'var(--danger)' }
                  : undefined
              }
            >
              {programTabBadge}
            </span>
          </button>
          <button
            type="button"
            className={activeTab === 'notes' ? 'on' : undefined}
            onClick={() => setActiveTab('notes')}
          >
            <Icon name="NotebookPen" size={16} />
            Notes
            <span className="cnt">—</span>
          </button>
        </div>

        {activeTab === 'onb' ? (
          <div
            className="g"
            style={{
              gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)',
            }}
          >
            <div className="card card-flush">
              <div className="cs">
                <span className="cs-t">Onboarding path</span>
                <span className="bdg bdg-b">Gate {gateCount} of 4</span>
                {isProgramOverdue ? (
                  <span className="bdg bdg-d">
                    <Icon name="CircleAlert" size={12} />
                    Program overdue
                  </span>
                ) : null}
                <span className="sp">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setChangeOnboardingOpen(true)}
                  >
                    <Icon name="Wrench" size={15} />
                    Change onboarding
                  </button>
                </span>
              </div>
              <div style={{ padding: '18px 20px 6px' }}>
                <div className="space-y-4">
                  <AppointmentCard
                    title="1. Screening"
                    appointments={screeningAppointments}
                    profileCompletion={{
                      screening_completed: user.screening_completed,
                      consultation_completed: user.consultation_completed,
                    }}
                    stepType="screening"
                  />
                  <McIntakeCard survey={mcIntakeSurvey} />
                  <AppointmentCard
                    title="3. Virtual Consultation"
                    appointments={consultationAppointments}
                    profileCompletion={{
                      screening_completed: user.screening_completed,
                      consultation_completed: user.consultation_completed,
                    }}
                    stepType="consultation"
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
                    compliance={compliance}
                    organizations={organizations}
                    userId={user.id}
                    userFirstName={user.first_name}
                    userLastName={user.last_name}
                    maxGateUnlocked={user.max_gate_unlocked}
                  />
                </div>
              </div>
            </div>

            <div>
              <ComplianceChartCard
                compliance={compliance}
                programAssignment={programAssignment}
              />
              <div style={{ marginTop: 12 }}>
                <HpCard
                  currentLevel={user.current_level}
                  hpPoints={user.hp_points}
                  pointsRequiredForNextLevel={user.points_for_next_level}
                  currentPhase={user.current_phase}
                  levelDescription={hpLevelThreshold?.description ?? null}
                  levelImageUrl={hpLevelThreshold?.image_url ?? null}
                  transactions={hpTransactions}
                />
              </div>
              <div
                className="g g2"
                style={{ gap: 12, marginTop: 12 }}
              >
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
        ) : null}

        {activeTab === 'prog' ? (
          <ProgramStatusCard
            assignment={programAssignment}
            compliance={compliance}
            schedule={schedule}
            completion={completion}
            exerciseNamesMap={exerciseNamesMap}
            groupsMap={groupsMap}
            userId={user.id}
            userFirstName={user.first_name}
            userLastName={user.last_name}
            maxGateUnlocked={user.max_gate_unlocked}
          />
        ) : null}

        {activeTab === 'notes' ? <MemberNotesTab /> : null}

        <ChangeOnboardingDialog
          open={changeOnboardingOpen}
          onOpenChange={setChangeOnboardingOpen}
          user={{
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            status: user.status,
          }}
        />
      </div>
    </>
  );
}
