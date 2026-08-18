'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/medvanta';
import type {
  DashboardStatusCounts,
  UserNeedingAttention,
} from '@/lib/supabase/queries/dashboard';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { HtmlAvatar } from './html-avatar';
import { HtmlStatTile } from './html-stat-tile';
import { HtmlDonut } from './html-donut';
import { HtmlProgressBar } from './html-progress-bar';

/** Mock spark series when real time-series data is unavailable (HTML scDashboard). */
const MOCK_SPARKS = {
  active: [44, 47, 46, 51, 54, 53, 57, 61],
  inProgram: [36, 38, 39, 41, 40, 43, 44, 45],
  completion: [19, 18, 17, 17, 15, 15, 14, 13],
  overdue: [2, 3, 3, 4, 4, 5, 5, 6],
};

const MOCK_FUNNEL = [
  { label: 'Intake survey signed', count: 88, total: 129 },
  { label: 'Screening attended', count: 74, total: 129 },
  { label: 'Consultation attended', count: 61, total: 129 },
  { label: 'Program assigned', count: 45, total: 129 },
] as const;

const MOCK_ACTIVITY = [
  { name: 'Nadia Okonjo', text: 'completed Week 3 Day 2', when: '2h ago' },
  { name: 'Chuck Bolland', text: 'logged a check-in — pain 2/10', when: '5h ago' },
  { name: 'Temi Adeyemi', text: 'signed the intake survey', when: '5h ago' },
  { name: 'Kiyoko Mori', text: 'opened the app', when: '6h ago' },
] as const;

/** Proxy for HTML "overdue" when due-date data is not available. */
const URGENT_COMPLIANCE_LT = 30;

type HtmlDashboardStatusCounts = DashboardStatusCounts & {
  programCompleted?: number;
};

function pct(n: number, d: number): number {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function isUrgentAttention(item: UserNeedingAttention): boolean {
  return item.compliance < URGENT_COMPLIANCE_LT;
}

function attentionReason(item: UserNeedingAttention): string {
  const compliance = Math.round(item.compliance);
  if (isUrgentAttention(item)) {
    return item.program_name
      ? `Very low compliance (${compliance}%) · ${item.program_name}`
      : `Very low compliance (${compliance}%)`;
  }
  return item.program_name
    ? `Low compliance (${compliance}%) · ${item.program_name}`
    : `Low compliance (${compliance}%)`;
}

export function HtmlDashboard({
  statusCounts,
  needingAttention,
  compliancePct,
}: {
  statusCounts: HtmlDashboardStatusCounts;
  needingAttention: UserNeedingAttention[];
  compliancePct: number;
}): React.ReactElement {
  const router = useRouter();
  const [assignProgramUser, setAssignProgramUser] =
    useState<UserNeedingAttention | null>(null);
  const overdue = needingAttention.filter(isUrgentAttention);
  const rows = needingAttention;

  const legend = useMemo(() => {
    const inProgram = statusCounts.inProgram ?? 0;
    const invited = statusCounts.invited ?? 0;
    const active = statusCounts.active ?? 0;
    const noProgram =
      statusCounts.noProgram ?? Math.max(active - inProgram, 0);
    const programCompleted = statusCounts.programCompleted ?? 0;
    return [
      { label: 'In a program', value: inProgram, color: 'var(--cyan-500)' },
      {
        label: 'Program completed',
        value: programCompleted,
        color: 'var(--navy-700)',
      },
      { label: 'No program yet', value: noProgram, color: 'var(--slate-300)' },
      { label: 'Invited, not started', value: invited, color: 'var(--slate-200)' },
    ];
  }, [statusCounts]);

  return (
    <div className="body">
      <div className="g g4" style={{ marginBottom: 16 }}>
        <HtmlStatTile
          label="Active members"
          value={statusCounts.active}
          delta="+4 WoW"
          trend="up"
          icon="UsersRound"
          spark={MOCK_SPARKS.active}
        />
        <HtmlStatTile
          label="In a program"
          value={statusCounts.inProgram}
          delta="+2 WoW"
          trend="up"
          icon="ClipboardList"
          spark={MOCK_SPARKS.inProgram}
        />
        <HtmlStatTile
          label="Avg. completion"
          value={`${Math.round(compliancePct)}%`}
          delta="-2 pts WoW"
          trend="down"
          icon="Percent"
          spark={MOCK_SPARKS.completion}
        />
        <HtmlStatTile
          label="Programs overdue"
          value={overdue.length}
          delta={overdue.length ? `+${Math.min(overdue.length, 2)} WoW` : undefined}
          trend={overdue.length ? 'up' : 'flat'}
          icon="Hourglass"
          footer="Past the 5 working day deadline"
          spark={MOCK_SPARKS.overdue}
        />
      </div>

      <div
        className="g"
        style={{
          gridTemplateColumns: 'minmax(0,1.65fr) minmax(0,1fr)',
          marginBottom: 16,
        }}
      >
        <div className="card card-flush">
          <div className="cs">
            <span className="cs-t">Needs attention</span>
            <span className="bdg bdg-b">{needingAttention.length}</span>
            {overdue.length ? (
              <span className="bdg bdg-d">{overdue.length} overdue</span>
            ) : null}
            <span className="sp">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => router.push('/users')}
              >
                View all
                <Icon name="ArrowRight" size={15} />
              </button>
            </span>
          </div>
          <div
            style={{
              maxHeight: 360,
              overflow: 'auto',
              minHeight: 0,
            }}
          >
            <table className="tbl" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Issue</th>
                  <th>Completion</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: 24, color: 'var(--text-muted)' }}
                    >
                      No members need attention right now.
                    </td>
                  </tr>
                ) : (
                  rows.map((item) => {
                    const name =
                      [item.first_name, item.last_name]
                        .filter(Boolean)
                        .join(' ') ||
                      item.email ||
                      'Member';
                    const isOverdue = isUrgentAttention(item);
                    return (
                      <tr key={item.user_id}>
                        <td>
                          <div className="cellp">
                            <HtmlAvatar name={name} size={32} />
                            <span style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                              <span className="nm" style={{ display: 'block' }}>
                                {name}
                              </span>
                              <span className="em">{item.email ?? '—'}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'block',
                              fontSize: 'var(--text-sm)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              ...(isOverdue
                                ? {
                                    color: 'var(--danger)',
                                    fontWeight: 'var(--fw-semibold)' as const,
                                  }
                                : {}),
                            }}
                            title={attentionReason(item)}
                          >
                            {isOverdue ? (
                              <Icon
                                name="CircleAlert"
                                size={13}
                                style={{
                                  display: 'inline',
                                  verticalAlign: '-2px',
                                  marginRight: 5,
                                }}
                              />
                            ) : null}
                            {attentionReason(item)}
                          </span>
                        </td>
                        <td>
                          <HtmlProgressBar pct={Math.round(item.compliance)} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${isOverdue ? 'btn-pri' : 'btn-sec'}`}
                            onClick={() => {
                              if (isOverdue) {
                                setAssignProgramUser(item);
                                return;
                              }
                              router.push(
                                `/messages?userId=${encodeURIComponent(item.user_id)}`,
                              );
                            }}
                          >
                            {isOverdue ? 'Assign program' : 'Message'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {assignProgramUser ? (
            <AssignProgramModal
              open={assignProgramUser !== null}
              onOpenChange={(open) => {
                if (!open) setAssignProgramUser(null);
              }}
              userId={assignProgramUser.user_id}
              userFirstName={assignProgramUser.first_name ?? undefined}
              userLastName={assignProgramUser.last_name ?? undefined}
              fromPath="/"
              onAssignSuccess={() => {
                router.refresh();
                setAssignProgramUser(null);
              }}
            />
          ) : null}
        </div>

        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">Program completion</div>
              <div className="ch-s">Sets and exercises finished vs. assigned</div>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'center', marginBottom: 16 }}>
            <HtmlDonut
              pct={Math.round(compliancePct)}
              size={158}
              label={`${Math.round(compliancePct)}%`}
              sub="aggregate"
            />
          </div>
          {legend.map((row) => (
            <div
              key={row.label}
              className="row"
              style={{
                justifyContent: 'space-between',
                padding: '7px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span className="row" style={{ gap: 9 }}>
                <i
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    background: row.color,
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: 'var(--text-sm)' }}>{row.label}</span>
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-strong)',
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="g"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}
      >
        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">Onboarding funnel</div>
              <div className="ch-s">Where members drop out of the 5-gate path</div>
            </div>
            <span className="bdg">129 total · mock</span>
          </div>
          {MOCK_FUNNEL.map((step, index) => {
            const share = pct(step.count, step.total);
            return (
              <div
                key={step.label}
                style={{ marginBottom: index === MOCK_FUNNEL.length - 1 ? 0 : 15 }}
              >
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', marginBottom: 5 }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--fw-medium)',
                      color: 'var(--text-body)',
                    }}
                  >
                    {step.label}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
                  >
                    {step.count} / {step.total}
                  </span>
                </div>
                <HtmlProgressBar pct={share} />
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">Recent activity</div>
              <div className="ch-s">Last 24 hours across all groups · mock</div>
            </div>
          </div>
          {MOCK_ACTIVITY.map((row) => (
            <div
              key={`${row.name}-${row.when}`}
              className="row"
              style={{
                gap: 11,
                padding: '9px 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <HtmlAvatar name={row.name} size={28} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)' }}>
                <b
                  style={{
                    color: 'var(--text-strong)',
                    fontWeight: 'var(--fw-semibold)',
                  }}
                >
                  {row.name}
                </b>{' '}
                {row.text}
              </span>
              <span
                className="mono"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}
              >
                {row.when}
              </span>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ marginTop: 12, marginLeft: -14 }}
            disabled
            title="Placeholder — activity log not wired"
          >
            View the full activity log
            <Icon name="ArrowRight" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
