import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { AdminProfileViewUI } from './admin-profile-view-ui';

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
  // If data not provided, fetch it
  let organizations = providedOrganizations;

  if (!organizations) {
    const orgMembersQuery = new OrganizationMembers();
    const organizationsResult = await orgMembersQuery.getOrganizationsByUserId(user.id);
    organizations = organizationsResult.success
      ? organizationsResult.data
      : [];
  }

  return (
    <AdminProfileViewUI
      user={user}
      organizations={organizations}
      currentUserId={currentUserId}
    />
  );
}