import { notFound } from 'next/navigation';
import { AdminsQuery } from '@/lib/supabase/queries/admins';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { createParallelQueries } from '@/lib/supabase/query';
import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import { AdminProfileView } from '../../users/[id]/partials/admin/profile-view';

export default async function ManageAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const adminsQuery = new AdminsQuery();
  const adminResult = await adminsQuery.getById(id);

  if (!adminResult.success) {
    notFound();
  }

  const user = adminResult.data;
  const orgMembersQuery = new OrganizationMembers();
  const adminData = await createParallelQueries({
    currentUser: {
      query: () => getAuthProfile(),
      defaultValue: null,
    },
    organizations: {
      query: () => orgMembersQuery.getOrganizationsWhereUserIsAdmin(id),
      defaultValue: [],
    },
  });

  const currentUserId = adminData.currentUser?.id ?? null;
  const organizations = Array.isArray(adminData.organizations)
    ? adminData.organizations.map((org) => ({
        ...org,
        is_active: null,
        is_super_admin: null,
        created_at: null,
        updated_at: null,
      }))
    : [];

  return (
    <AdminProfileView
      user={user}
      currentUserId={currentUserId}
      organizations={organizations}
    />
  );
}
