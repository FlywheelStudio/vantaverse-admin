'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { UserProfileCard } from '@/components/users/user-profile-card';
import { Card } from '@/components/medvanta';
import { ManagementOverviewCard } from './management-overview-card';
import { ComplianceCard } from './compliance-card';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { UserNeedingAttention } from '@/lib/supabase/queries/dashboard';

interface AdminProfileViewUIProps {
  user: ProfileWithStats;
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
}: AdminProfileViewUIProps) {
  const isYourself = useMemo(
    () => user.id === currentUserId,
    [user.id, currentUserId],
  );

  const orgNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of organizations) map.set(o.id, o.name);
    return map;
  }, [organizations]);

  const chartData = useMemo(
    () =>
      complianceByOrg.map((row) => ({
        organizationId: row.organizationId,
        organizationName: orgNameById.get(row.organizationId) ?? row.organizationId,
        compliance: row.compliance,
        programCompletion: row.programCompletion,
      })),
    [complianceByOrg, orgNameById],
  );

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">
          {isYourself
            ? 'Your '
            : `${user.first_name && `${user.first_name}'s `} `}
          Profile
        </h1>
      }
    >
      <div className="flex flex-col gap-6 h-full min-h-0">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card padding={0} className="overflow-hidden">
            <div className="border-b border-[var(--border-subtle)] bg-[color-mix(in_oklch,var(--primary)_8%,var(--surface-card))] p-8">
              <UserProfileCard
                userId={user.id}
                firstName={user.first_name || ''}
                lastName={user.last_name || ''}
                email={user.email || ''}
                avatarUrl={user.avatar_url}
                description={user.description}
                role={user.role}
                programDueDate={user.program_due_date}
              />
            </div>
          </Card>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-4">
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
        </div>
      </div>
    </PageWrapper>
  );
}
