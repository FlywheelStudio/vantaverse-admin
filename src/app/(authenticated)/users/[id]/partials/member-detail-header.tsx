'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Icon } from '@/components/medvanta';
import { HtmlAvatar } from '../../html-helpers';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import { AssignProgramModal } from './assign-program-modal';

interface MemberDetailHeaderProps {
  user: ProfileWithStats;
  organizations?: Array<{ id: string; name: string; description: string | null }>;
  physiologist?: {
    firstName: string;
    lastName: string;
  } | null;
  programAssignment: ProgramAssignmentWithTemplate | null;
  onChangeOnboarding?: () => void;
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

export function MemberDetailHeader({
  user,
  organizations = [],
  physiologist,
  programAssignment,
  onChangeOnboarding,
}: MemberDetailHeaderProps): React.ReactElement {
  const [assignOpen, setAssignOpen] = useState(false);
  const displayName = getDisplayName(user);
  const groupName = organizations[0]?.name ?? '—';
  const physiologistName = physiologist
    ? `${physiologist.firstName} ${physiologist.lastName}`.trim()
    : '—';
  const programName = programAssignment?.program_template?.name ?? 'Awaiting assignment';
  const isOverdue =
    user.program_due_date != null &&
    new Date(user.program_due_date) < new Date() &&
    !programAssignment;
  const lastActive = user.last_sign_in
    ? formatDistanceToNow(new Date(user.last_sign_in), { addSuffix: true })
    : '—';

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
              {isOverdue ? (
                <span className="bdg bdg-d">
                  <Icon name="CircleAlert" size={12} />
                  Program overdue
                </span>
              ) : null}
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
            <button type="button" className="btn btn-sec" disabled title="Placeholder">
              <Icon name="MessageSquare" size={17} />
              Message
            </button>
            <button
              type="button"
              className="btn btn-pri"
              onClick={() => setAssignOpen(true)}
            >
              <Icon name="ClipboardList" size={17} />
              Assign program
            </button>
            <div className="tip">
              <button
                type="button"
                className="ib ib-sec"
                aria-label="More actions"
                onClick={onChangeOnboarding}
              >
                <Icon name="Ellipsis" size={18} />
              </button>
              <span className="tt">
                Change onboarding · Move to another group · Swap program · Reset
                progress · Deactivate
              </span>
            </div>
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
