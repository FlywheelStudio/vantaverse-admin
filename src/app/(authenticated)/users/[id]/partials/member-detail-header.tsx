'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Icon } from '@/components/medvanta';
import { HtmlAvatar } from '../../html-helpers';
import { HtmlMoreButton } from '@/app/(authenticated)/builder/partials/html-toolbar';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import { AssignProgramModal } from './assign-program-modal';
import { formatDueLabel, getProgramSlaMode } from './program-sla';

interface MemberDetailHeaderProps {
  user: ProfileWithStats;
  organizations?: Array<{ id: string; name: string; description: string | null }>;
  physiologist?: {
    firstName: string;
    lastName: string;
  } | null;
  programAssignment: ProgramAssignmentWithTemplate | null;
  onChangeOnboarding?: () => void;
  /** Controlled assign-program modal (shared with profile tabs). */
  assignOpen?: boolean;
  onAssignOpenChange?: (open: boolean) => void;
}

function getDisplayName(user: ProfileWithStats): string {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}

function getStatusBadge(user: ProfileWithStats): React.ReactElement {
  const status = user.status ?? 'active';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  if (status === 'active' || status === 'assigned') {
    return (
      <span className="bdg bdg-b">
        <i className="dot" aria-hidden />
        {label}
      </span>
    );
  }
  return <span className="bdg bdg-o">{label}</span>;
}

function getProgramSlaBadge(
  user: ProfileWithStats,
  programAssignment: ProgramAssignmentWithTemplate | null,
): React.ReactElement | null {
  const slaMode = getProgramSlaMode({
    programDueDate: user.program_due_date,
    hasAssignment: Boolean(programAssignment),
  });

  if (slaMode === 'assigned' || slaMode === 'none') return null;

  const dueLabel =
    user.program_due_date != null && user.program_due_date !== ''
      ? formatDueLabel({
          programDueDate: user.program_due_date,
          mode: slaMode,
        })
      : null;

  if (slaMode === 'overdue') {
    return (
      <span className="bdg bdg-d">
        <Icon name="CircleAlert" size={12} />
        {dueLabel?.label ?? 'Program overdue'}
      </span>
    );
  }

  return (
    <span className="bdg">
      <Icon name="Hourglass" size={12} />
      Program due
      {dueLabel?.dueText
        ? ` · ${dueLabel.dueText.replace(/^due /, '')}`
        : null}
    </span>
  );
}

export function MemberDetailHeader({
  user,
  organizations = [],
  physiologist,
  programAssignment,
  onChangeOnboarding,
  assignOpen: assignOpenProp,
  onAssignOpenChange,
}: MemberDetailHeaderProps): React.ReactElement {
  const router = useRouter();
  const [assignOpenInternal, setAssignOpenInternal] = useState(false);
  const assignOpen = assignOpenProp ?? assignOpenInternal;
  const setAssignOpen = onAssignOpenChange ?? setAssignOpenInternal;
  const displayName = getDisplayName(user);
  const groupName = organizations[0]?.name ?? '—';
  const physiologistName = physiologist
    ? `${physiologist.firstName} ${physiologist.lastName}`.trim()
    : '—';
  const programName = programAssignment?.program_template?.name ?? 'Awaiting assignment';
  const programSlaBadge = getProgramSlaBadge(user, programAssignment);
  const lastActive = user.last_sign_in
    ? formatDistanceToNow(new Date(user.last_sign_in), { addSuffix: true })
    : '—';

  const handleMessage = (): void => {
    router.push(`/messages?userId=${encodeURIComponent(user.id)}`);
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16, padding: 22 }}>
        <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
          <HtmlAvatar name={displayName} src={user.avatar_url} size={72} status />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 10 }}>
              <h2
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 800,
                  letterSpacing: '-.02em',
                }}
              >
                {displayName}
              </h2>
              <span className="bdg bdg-b">Member</span>
              {getStatusBadge(user)}
              {programSlaBadge}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
                marginTop: 4,
              }}
            >
              {user.email ?? '—'}
            </div>
            <div
              className="row"
              style={{ gap: 22, flexWrap: 'wrap', marginTop: 14 }}
            >
              {[
                ['Building2', 'Group', groupName],
                ['UserRound', 'Physiologist', physiologistName],
                ['ClipboardList', 'Program', programName],
                ['Calendar', 'Joined', user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'],
                ['Activity', 'Last active', lastActive],
              ].map(([icon, label, value]) => (
                <span key={label} style={{ minWidth: 0 }}>
                  <span
                    className="row"
                    style={{
                      gap: 5,
                      fontSize: 'var(--text-2xs)',
                      fontWeight: 700,
                      letterSpacing: '.06em',
                      textTransform: 'uppercase',
                      color: 'var(--text-faint)',
                    }}
                  >
                    <Icon name={icon} size={12} />
                    {label}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-md)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-strong)',
                      marginTop: 3,
                    }}
                  >
                    {value}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="row" style={{ gap: 8, flex: '0 0 auto' }}>
            <button type="button" className="btn btn-sec" onClick={handleMessage}>
              <Icon name="MessageSquare" size={17} />
              Message
            </button>
            <button
              type="button"
              className="btn btn-acc"
              onClick={() => setAssignOpen(true)}
            >
              <Icon name="ClipboardList" size={17} />
              Assign program
            </button>
            <HtmlMoreButton
              items={[
                {
                  id: 'onboarding',
                  label: 'Change onboarding',
                  onSelect: onChangeOnboarding,
                },
                {
                  id: 'move',
                  label: 'Move to another group',
                  onSelect: () => toastUnavailable('Move to another group'),
                },
                {
                  id: 'swap',
                  label: 'Swap program',
                  onSelect: () => toastUnavailable('Swap program'),
                },
                {
                  id: 'reset',
                  label: 'Reset progress',
                  onSelect: () => toastUnavailable('Reset progress'),
                },
                {
                  id: 'deactivate',
                  label: 'Deactivate',
                  danger: true,
                  onSelect: () => toastUnavailable('Deactivate'),
                },
              ]}
            />
          </div>
        </div>
      </div>

      <AssignProgramModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        userId={user.id}
        userFirstName={user.first_name}
        userLastName={user.last_name}
        fromPath="profile"
      />
    </>
  );
}
