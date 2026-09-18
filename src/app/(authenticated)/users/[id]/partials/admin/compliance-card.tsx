'use client';

import Link from 'next/link';
import { AdminComplianceBarChart, type ComplianceByOrgItem } from './bar-chart';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';
import { Avatar } from '@/components/widgets/avatar';
import { ProgressBar } from '@/components/widgets/progress-bar';
import { Icon } from '@/components/medvanta';

/** Max visible rows before the list scrolls (matches dashboard attention panel density). */
const LOW_COMPLIANCE_SCROLL_MAX_HEIGHT = 280;

interface ComplianceCardProps {
  chartData: ComplianceByOrgItem[];
  lowComplianceUsers: UserNeedingAttention[];
}

function displayName(user: UserNeedingAttention): string {
  const parts = [user.first_name, user.last_name].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  return user.email ?? user.user_id;
}

export function ComplianceCard({
  chartData,
  lowComplianceUsers,
}: ComplianceCardProps): React.ReactElement {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="ch" style={{ marginBottom: 0 }}>
        <div>
          <div className="ch-t">Group compliance</div>
          <div className="ch-s">Compliance vs program completion by group</div>
        </div>
      </div>

      <AdminComplianceBarChart data={chartData} />

      <div
        className="card card-flush"
        style={{ padding: 0, margin: '0 -4px', boxShadow: 'none' }}
      >
        <div className="cs" style={{ paddingLeft: 4, paddingRight: 4 }}>
          <span className="cs-t">Low compliance</span>
          <span className="bdg bdg-o">{lowComplianceUsers.length}</span>
          <span className="sp">
            <Link href="/users" className="btn btn-ghost btn-sm">
              View members
              <Icon name="ArrowRight" size={15} />
            </Link>
          </span>
        </div>

        {lowComplianceUsers.length === 0 ? (
          <p
            style={{
              padding: '16px 4px 4px',
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
            }}
          >
            No members below the compliance threshold in these groups.
          </p>
        ) : (
          <div
            style={{
              maxHeight: LOW_COMPLIANCE_SCROLL_MAX_HEIGHT,
              overflow: 'auto',
              minHeight: 0,
            }}
          >
            <table className="tbl" style={{ tableLayout: 'fixed', width: '100%' }}>
              <colgroup>
                <col style={{ width: '58%' }} />
                <col style={{ width: '42%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {lowComplianceUsers.map((user) => {
                  const name = displayName(user);
                  return (
                    <tr key={user.user_id}>
                      <td>
                        <Link
                          href={`/users/${user.user_id}`}
                          className="cellp"
                          style={{ color: 'inherit', textDecoration: 'none' }}
                        >
                          <Avatar name={name} size={32} />
                          <span style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                            <span className="nm" style={{ display: 'block' }}>
                              {name}
                            </span>
                            <span className="em">{user.email ?? '—'}</span>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <ProgressBar
                          pct={Math.round(user.compliance)}
                          tone={user.compliance < 40 ? 'danger' : 'accent'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
