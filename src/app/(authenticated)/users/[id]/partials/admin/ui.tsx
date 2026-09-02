'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AppBar } from '@/components/medvanta/shell';
import { UserProfileCard } from '@/components/users/user-profile-card';
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
    for (const organization of organizations) map.set(organization.id, organization.name);
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

  return (
    <>
      <AppBar
        crumbs={
          isYourself
            ? [{ label: 'Your profile' }]
            : [{ label: 'Manage', href: '/manage' }, { label: displayName }]
        }
        title={isYourself ? 'Your profile' : `${displayName}'s profile`}
      />
      <div className="body">
        <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
          <div
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              background:
                'color-mix(in oklch, var(--primary) 8%, var(--surface-card))',
              padding: 32,
            }}
          >
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
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="g"
          style={{ gridTemplateColumns: '1fr 1fr' }}
        >
          <ManagementOverviewCard
            organizations={organizations}
            totalMemberCount={totalMemberCount}
            memberCountsByOrg={memberCountsByOrg}
          />
          <ComplianceCard
            chartData={chartData}
            lowComplianceUsers={lowComplianceUsers}
            organizations={organizations}
          />
        </motion.div>
      </div>
    </>
  );
}
