import { Icon } from '@/components/medvanta/actions/Icon';
import { UnderConstruction } from '@/components/medvanta/feedback/UnderConstruction';
import type {
  DashboardStatusCounts,
  UserNeedingAttention,
} from './queries';
import { Avatar } from '@/components/widgets/avatar';
import { StatTile } from '@/components/widgets/stat-tile';
import { Donut } from '@/components/widgets/donut';
import { ProgressBar } from '@/components/widgets/progress-bar';

type DashboardStatusCountsProp = DashboardStatusCounts & {
  programCompleted?: number;
};

interface DashboardLegendItem {
  label: string;
  value: number;
  color: string;
}

interface DashboardAttentionRow {
  item: UserNeedingAttention;
  name: string;
}

export type DashboardDelta = { text: string; trend: 'up' | 'down' | 'flat' };

 interface DashboardUiProps {
  statusCounts: DashboardStatusCountsProp;
  compliancePct: number;
  attentionCount: number;
  rows: DashboardAttentionRow[];
  overdueCount: number;
  legend: DashboardLegendItem[];
  sparks: {
    active: number[];
    inProgram: number[];
    completion: number[];
    overdue: number[];
  };
  deltas: DashboardDelta[];
  onViewAllUsers: () => void;
  onOpenUser: (userId: string) => void;
}

/** Presentational dashboard layout — no hooks. */
export function DashboardUi({
  statusCounts,
  compliancePct,
  attentionCount,
  rows,
  overdueCount,
  legend,
  sparks,
  deltas,
  onViewAllUsers,
  onOpenUser,
}: DashboardUiProps): React.ReactElement {
  return (
    <div className="body">
      <div className="g g4" style={{ marginBottom: 16 }}>
        <StatTile
          label="Active members"
          value={statusCounts.active}
          delta={deltas[0].text}
          trend={deltas[0].trend}
          icon="UsersRound"
          spark={sparks.active}
        />
        <StatTile
          label="In a program"
          value={statusCounts.inProgram}
          delta={deltas[1].text}
          trend={deltas[1].trend}
          icon="ClipboardList"
          spark={sparks.inProgram}
        />
        <StatTile
          label="Avg. completion"
          value={`${Math.round(compliancePct)}%`}
          delta={deltas[2].text}
          trend={deltas[2].trend}
          icon="Percent"
          spark={sparks.completion}
        />
        <StatTile
          label="Programs overdue"
          value={overdueCount}
          delta={deltas[3].text || undefined}
          trend={deltas[3].trend}
          icon="Hourglass"
          footer="No program assigned within 12 days of consultation"
          spark={sparks.overdue}
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
            <span className="bdg bdg-b">{attentionCount}</span>
            {overdueCount ? (
              <span className="bdg bdg-d">{overdueCount} overdue</span>
            ) : null}
            <span className="sp">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onViewAllUsers}
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
                  rows.map(({ item, name }) => (
                    <tr key={item.user_id}>
                      <td>
                        <div className="cellp">
                          <Avatar name={name} size={32} />
                          <span style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <span className="nm" style={{ display: 'block' }}>
                              {name}
                            </span>
                            <span className="em">{item.email ?? '—'}</span>
                          </span>
                        </div>
                      </td>
                      <td />
                      <td>
                        <ProgressBar pct={Math.round(item.compliance)} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-sec"
                          onClick={() => onOpenUser(item.user_id)}
                        >
                          Open user
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">Program completion</div>
              <div className="ch-s">Sets and exercises finished vs. assigned</div>
            </div>
          </div>
          <div className="row" style={{ justifyContent: 'center', marginBottom: 16 }}>
            <Donut
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
          </div>
          <UnderConstruction />
        </div>

        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">Recent activity</div>
              <div className="ch-s">Last 24 hours across all groups</div>
            </div>
          </div>
          <UnderConstruction />
        </div>
      </div>
    </div>
  );
}
