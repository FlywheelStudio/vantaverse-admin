import { query } from '@/lib/dal';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import {
  getComplianceAndCompletionByOrganizationIdsQuery,
  getUsersWithLowComplianceByOrganizationIdsQuery,
  type UserNeedingAttention,
} from '@/lib/supabase/queries/dashboard';
import type { AdminProfile } from '@/lib/supabase/schemas/admins';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { AdminProfileViewUI } from './ui';

interface AdminProfileViewProps {
  user: AdminProfile;
  currentUserId: string | null;
  organizations?: Organization[];
}

export async function AdminProfileView({
  user,
  currentUserId,
  organizations: providedOrganizations,
}: AdminProfileViewProps): Promise<React.ReactElement> {
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

  let totalMemberCount = 0;
  let memberCountsByOrg: Record<string, number> = {};
  let complianceByOrg: Array<{
    organizationId: string;
    compliance: number;
    programCompletion: number;
  }> = [];
  let lowComplianceUsers: UserNeedingAttention[] = [];

  if (orgIds.length > 0) {
    const orgMembersQuery = new OrganizationMembers();

    const [
      totalMemberCountResult,
      memberCountsByOrgResult,
      complianceByOrgResult,
      lowComplianceUsersResult,
    ] = await Promise.all([
      orgMembersQuery.getTotalMemberCountForOrganizations(orgIds),
      orgMembersQuery.getMemberCountsByOrganizationIds(orgIds),
      query(getComplianceAndCompletionByOrganizationIdsQuery, orgIds),
      query(getUsersWithLowComplianceByOrganizationIdsQuery, orgIds, 70),
    ]);

    totalMemberCount = totalMemberCountResult.success
      ? totalMemberCountResult.data
      : 0;
    memberCountsByOrg = memberCountsByOrgResult.success
      ? memberCountsByOrgResult.data
      : {};
    complianceByOrg = complianceByOrgResult[0] ? [] : complianceByOrgResult[1];
    lowComplianceUsers = lowComplianceUsersResult[0]
      ? []
      : lowComplianceUsersResult[1].users;
  }

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
