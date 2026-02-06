import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { DashboardQuery } from '@/lib/supabase/queries/dashboard';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { createParallelQueries } from '@/lib/supabase/query';
import { AdminProfileViewUI } from './ui';

interface AdminProfileViewProps {
  user: ProfileWithStats;
  currentUserId: string | null;
  organizations?: Organization[];
}

export async function AdminProfileView({
  user,
  currentUserId,
  organizations: providedOrganizations,
}: AdminProfileViewProps) {
  let organizations = providedOrganizations;

  if (!organizations) {
    const orgMembersQuery = new OrganizationMembers();
    const organizationsResult = await orgMembersQuery.getOrganizationsByUserId(user.id);
    organizations = organizationsResult.success
      ? organizationsResult.data.map((org) => ({
          ...org,
          is_active: null,
          is_super_admin: null,
          created_at: null,
          updated_at: null,
        }))
      : [];
  }

  const orgList = organizations ?? [];
  const orgIds = orgList.map((o) => o.id);

  const dashboardQuery = new DashboardQuery();
  const orgMembersQuery = new OrganizationMembers();

  const overviewData = await createParallelQueries({
    totalMemberCount: {
      condition: orgIds.length > 0,
      query: () => orgMembersQuery.getTotalMemberCountForOrganizations(orgIds),
      defaultValue: 0,
    },
    memberCountsByOrg: {
      condition: orgIds.length > 0,
      query: () => orgMembersQuery.getMemberCountsByOrganizationIds(orgIds),
      defaultValue: {} as Record<string, number>,
    },
    complianceByOrg: {
      condition: orgIds.length > 0,
      query: () => dashboardQuery.getComplianceAndCompletionByOrganizationIds(orgIds),
      defaultValue: [] as Array<{ organizationId: string; compliance: number; programCompletion: number }>,
    },
    lowComplianceUsers: {
      condition: orgIds.length > 0,
      query: () => dashboardQuery.getUsersWithLowComplianceByOrganizationIds(orgIds, 70),
      defaultValue: { users: [], total: 0 },
    },
  });

  const totalMemberCount = overviewData.totalMemberCount ?? 0;
  const memberCountsByOrg = overviewData.memberCountsByOrg ?? {};
  const complianceByOrg = overviewData.complianceByOrg ?? [];
  const lowComplianceUsers = overviewData.lowComplianceUsers?.users ?? [];

  return (
    <AdminProfileViewUI
      user={user}
      organizations={orgList}
      currentUserId={currentUserId}
      totalMemberCount={totalMemberCount}
      memberCountsByOrg={memberCountsByOrg}
      complianceByOrg={complianceByOrg}
      lowComplianceUsers={lowComplianceUsers}
    />
  );
}