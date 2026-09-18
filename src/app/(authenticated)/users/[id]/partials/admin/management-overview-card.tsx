'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Organization } from '@/lib/supabase/schemas/organizations';

interface ManagementOverviewCardProps {
  organizations: Organization[];
  memberCountsByOrg: Record<string, number>;
}

export function ManagementOverviewCard({
  organizations,
  memberCountsByOrg,
}: ManagementOverviewCardProps): React.ReactElement {
  return (
    <div className="card card-flush" style={{ padding: 0 }}>
      <div className="cs">
        <span className="cs-t">Groups you manage</span>
        <span className="bdg bdg-b">{organizations.length}</span>
        <span className="sp">
          <Link href="/groups" className="btn btn-ghost btn-sm">
            View all
          </Link>
        </span>
      </div>
      <div
        className="list-rows"
        style={{
          border: 'none',
          borderRadius: 0,
          maxHeight: 360,
          overflow: 'auto',
        }}
      >
        {organizations.map((org) => {
          const memberCount = memberCountsByOrg[org.id] ?? 0;
          return (
            <Link
              key={org.id}
              href={`/groups/${org.id}`}
              className="lrow"
            >
              <div
                className={org.picture_url ? 'logo-t' : 'thmb gr'}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  position: 'relative',
                  flex: '0 0 auto',
                }}
              >
                {org.picture_url ? (
                  <Image
                    src={org.picture_url}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 'var(--fw-bold)',
                      color: 'var(--navy-700)',
                    }}
                  >
                    {org.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <span style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
                <span className="nm">{org.name}</span>
                <span className="em">
                  {memberCount} {memberCount === 1 ? 'member' : 'members'}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
