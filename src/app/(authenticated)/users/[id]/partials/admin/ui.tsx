'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';
import { UserProfileCard } from '@/components/users/user-profile-card';
import { StatTile } from '@/components/widgets/stat-tile';
import { ManagementOverviewCard } from './management-overview-card';
import { ComplianceCard } from './compliance-card';
import type { AdminProfile } from '@/lib/supabase/schemas/admins';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';

interface AdminProfileViewUIProps {
  user: AdminProfile;
  organizations: Organization[];
  currentUserId: string | null;
  totalMemberCount: number;
  memberCountsByOrg: Record<string, number>;
  complianceByOrg: Array<{
    organizationId: string;
    compliance: number;
    programCompletion: number;
  }>;
  lowComplianceUsers: UserNeedingAttention[];
}

export function AdminProfileViewUI({
  user,
  organizations,
  currentUserId,
  totalMemberCount,
  memberCountsByOrg,
  complianceByOrg,
  lowComplianceUsers,
}: AdminProfileViewUIProps): React.ReactElement {
  const isYourself = useMemo(
    () => user.id === currentUserId,
    [user.id, currentUserId],
  );

  const displayName = useMemo(() => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Admin';
  }, [user.first_name, user.last_name]);

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const organization of organizations) {
      map.set(organization.id, organization.name);
    }
    return map;
  }, [organizations]);

  const chartData = useMemo(
    () =>
      complianceByOrg.map((row) => ({
        organizationId: row.organizationId,
        organizationName:
          orgNameById.get(row.organizationId) ?? row.organizationId,
        compliance: row.compliance,
        programCompletion: row.programCompletion,
      })),
    [complianceByOrg, orgNameById],
  );

  const avgCompliance = useMemo(() => {
    if (complianceByOrg.length === 0) return null;
    const sum = complianceByOrg.reduce((acc, row) => acc + row.compliance, 0);
    return Math.round(sum / complianceByOrg.length);
  }, [complianceByOrg]);

  const hasGroups = organizations.length > 0;

  return (
    <>
      <AppBar
        crumbs={
          isYourself
            ? [{ label: 'Your profile' }]
            : [{ label: 'Manage', href: '/manage' }, { label: displayName }]
        }
      />
      <div className="body">
        <div className="card" style={{ marginBottom: 16, padding: 22 }}>
          <UserProfileCard
            userId={user.id}
            firstName={user.first_name || ''}
            lastName={user.last_name || ''}
            email={user.email || ''}
            avatarUrl={user.avatar_url}
            description={user.description}
            role={user.role}
            programDueDate={null}
          />
        </div>

        {!hasGroups ? (
          <div className="card">
            <div className="ch">
              <div>
                <div className="ch-t">No groups assigned</div>
                <div className="ch-s">
                  This admin is not managing any groups yet. Assign them to a
                  group to see members, compliance, and overview stats here.
                </div>
              </div>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <Link href="/groups" className="btn btn-pri">
                <Icon name="Building2" size={15} />
                Go to Groups
              </Link>
              <Link href="/manage" className="btn btn-sec">
                Back to Manage
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div
              className={`g ${avgCompliance == null ? 'g2' : 'g3'}`}
              style={{ marginBottom: 16 }}
            >
              <StatTile
                label="Groups managing"
                value={organizations.length}
                icon="Building2"
                footer="Organizations this admin administers"
              />
              <StatTile
                label="Members managing"
                value={totalMemberCount}
                icon="UsersRound"
                footer="Unique members across their groups"
              />
              {avgCompliance != null ? (
                <StatTile
                  label="Avg. group compliance"
                  value={`${avgCompliance}%`}
                  icon="Percent"
                  footer="Mean compliance across managed groups"
                />
              ) : null}
            </div>

            <div
              className="g"
              style={{
                gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)',
              }}
            >
              <ManagementOverviewCard
                organizations={organizations}
                memberCountsByOrg={memberCountsByOrg}
              />
              <ComplianceCard
                chartData={chartData}
                lowComplianceUsers={lowComplianceUsers}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
