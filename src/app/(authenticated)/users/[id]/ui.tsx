'use client';

import { useMemo, useState } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Appointment } from '@/lib/supabase/queries/appointments';
import type { McIntakeSurvey } from '@/lib/supabase/queries/mc-intake';
import type { HabitPledge } from '@/lib/supabase/queries/habit-pledge';
import { ChangeOnboardingDialog } from './partials/change-onboarding-dialog';
import { MemberDetailHeader } from './partials/member-detail-header';
import { MemberNotesTab } from './partials/member-notes-tab';
import { HtmlOnboardingTab } from './partials/html-onboarding-tab';
import { HtmlProgramTab } from './partials/html-program-tab';
import { IntakeSurveyPlaceholderModal } from './partials/intake-survey-placeholder-modal';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

type MemberTab = 'onb' | 'prog' | 'notes';

type UserProfilePageUIProps = {
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
};

export function UserProfilePageUI({
  user,
  organizations,
  physiologistsByOrgId,
  mcIntakeSurvey,
  programAssignment,
  compliance,
}: UserProfilePageUIProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<MemberTab>('onb');
  const [changeOnboardingOpen, setChangeOnboardingOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [intakeSurveyOpen, setIntakeSurveyOpen] = useState(false);

  const isMember = user.role === 'patient' || !user.role;
  const displayName = useMemo(() => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Member';
  }, [user.first_name, user.last_name]);

  const primaryPhysiologist =
    organizations && organizations.length > 0
      ? physiologistsByOrgId.get(organizations[0].id) ?? null
      : null;

  const isProgramOverdue =
    user.program_due_date != null &&
    new Date(user.program_due_date) < new Date() &&
    !programAssignment;

  const programTabBadge = programAssignment
    ? `week ${Math.max(1, Math.ceil((compliance ?? 0) / 12.5))} of ${programAssignment.program_template?.weeks ?? 8}`
    : isProgramOverdue
      ? 'overdue'
      : 'not assigned';

  const header = (
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
      assignOpen={assignOpen}
      onAssignOpenChange={setAssignOpen}
    />
  );

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
        <div className="body">{header}</div>
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
        {header}

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
            <span className="cnt">2</span>
          </button>
        </div>

        {activeTab === 'onb' ? (
          <HtmlOnboardingTab
            user={user}
            onChangePath={() => setChangeOnboardingOpen(true)}
            onAssignProgram={() => setAssignOpen(true)}
            onOpenIntake={() => setIntakeSurveyOpen(true)}
          />
        ) : null}

        {activeTab === 'prog' ? (
          <HtmlProgramTab
            user={user}
            programAssignment={programAssignment}
            compliance={compliance}
            onAssignProgram={() => setAssignOpen(true)}
          />
        ) : null}

        {activeTab === 'notes' ? (
          <MemberNotesTab
            user={user}
            mcIntakeSurvey={mcIntakeSurvey}
            onOpenIntake={() => setIntakeSurveyOpen(true)}
          />
        ) : null}
      </div>

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

      <IntakeSurveyPlaceholderModal
        open={intakeSurveyOpen}
        onOpenChange={setIntakeSurveyOpen}
        survey={mcIntakeSurvey}
        memberName={displayName}
      />
    </>
  );
}
