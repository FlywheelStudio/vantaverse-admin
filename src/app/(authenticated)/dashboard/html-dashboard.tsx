'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/medvanta';
import { PlaceholderBlock } from '@/components/medvanta/shell';
import type { DashboardStatusCounts } from '@/lib/supabase/queries/dashboard';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';
import { HtmlAvatar } from './html-avatar';
import { HtmlDonut } from './html-donut';
import { HtmlStatTile } from './html-stat-tile';
import { attentionIssueLabel } from './html-utils';

export interface HtmlDashboardProps {
  statusCounts: DashboardStatusCounts & { programCompleted?: number };
  compliance: number;
  needingAttention: { users: UserNeedingAttention[]; total: number };
}

function ProgressBar({ value }: { value: number }): React.ReactElement {
  const pct = Math.max(value, 2);
  return (
    <div className="pbw">
      <span className="pb pb-6 pb-n">
        <i style={{ width: `${pct}%` }} />
      </span>
      <span className="v">{Math.round(value)}%</span>
    </div>
  );
}

interface LegendRowProps {
  color: string;
  label: string;
  count: number;
}

function LegendRow({ color, label, count }: LegendRowProps): React.ReactElement {
  return (
    <div
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
            background: color,
          }}
        />
        <span style={{ fontSize: 'var(--text-sm)' }}>{label}</span>
      </span>
      <span
        className="mono"
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--text-strong)',
        }}
      >
        {count}
      </span>
    </div>
  );
}

/** HTML `scDashboard` body: stat tiles, attention table, completion, placeholders. */
export function HtmlDashboard({
  statusCounts,
  compliance,
  needingAttention,
}: HtmlDashboardProps): React.ReactElement {
  const router = useRouter();
  const compliancePct = Math.round(compliance);
  const attentionUsers = needingAttention.users.slice(0, 7);

  const legendRows: LegendRowProps[] = [
    { label: 'In a program', count: statusCounts.inProgram, color: 'var(--cyan-500)' },
    {
      label: 'Program completed',
      count: statusCounts.programCompleted ?? 0,
      color: 'var(--navy-700)',
    },
    { label: 'No program yet', count: statusCounts.noProgram, color: 'var(--slate-300)' },
    { label: 'Invited, not started', count: statusCounts.invited, color: 'var(--slate-200)' },
  ];

  return (
    <div className="body">
      <div className="g g4" style={{ marginBottom: 16 }}>
        <HtmlStatTile
          label="Active members"
          value={String(statusCounts.active)}
          icon="UsersRound"
        />
        <HtmlStatTile
          label="In a program"
          value={String(statusCounts.inProgram)}
          icon="ClipboardList"
        />
        <HtmlStatTile
          label="Avg. completion"
          value={`${compliancePct}%`}
          icon="Percent"
        />
        <HtmlStatTile
          label="Programs overdue"
          value="—"
          icon="Hourglass"
          foot="Placeholder"
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
            <span className="bdg bdg-b">{needingAttention.total}</span>
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
          <table className="tbl">
            <thead>
              <tr>
                <th>Member</th>
                <th>Issue</th>
                <th>Completion</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {attentionUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px 0' }}>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                      No users need attention.
                    </span>
                  </td>
                </tr>
              ) : (
                attentionUsers.map((user) => {
                  const name =
                    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
                    'Unknown';
                  const subline = user.email ?? user.program_name ?? '—';
                  const issue = attentionIssueLabel(user.compliance, user.last_sign_in);
                  const isCritical = user.compliance <= 10;

                  return (
                    <tr key={user.user_id}>
                      <td style={{ width: '34%' }}>
                        <div className="cellp">
                          <HtmlAvatar name={name} size={32} />
                          <span style={{ minWidth: 0 }}>
                            <span className="nm" style={{ display: 'block' }}>
                              {name}
                            </span>
                            <span className="em">{subline}</span>
                          </span>
                        </div>
                      </td>
                      <td style={{ width: '30%' }}>
                        <span
                          style={{
                            fontSize: 'var(--text-sm)',
                            ...(isCritical
                              ? {
                                  color: 'var(--danger)',
                                  fontWeight: 'var(--fw-semibold)',
                                }
                              : {}),
                          }}
                        >
                          {isCritical ? (
                            <Icon
                              name="CircleAlert"
                              size={13}
                              className="mr-[5px] inline align-[-2px]"
                            />
                          ) : null}
                          {issue}
                        </span>
                      </td>
                      <td style={{ width: '20%' }}>
                        <ProgressBar value={user.compliance} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-sec"
                          onClick={() => router.push(`/users/${user.user_id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
              pct={compliancePct}
              label={`${compliancePct}%`}
              sub="aggregate"
            />
          </div>
          {legendRows.map((row) => (
            <LegendRow key={row.label} {...row} />
          ))}
        </div>
      </div>

      <div
        className="g"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}
      >
        <PlaceholderBlock title="Onboarding funnel" />
        <PlaceholderBlock title="Recent activity" />
      </div>
    </div>
  );
}
