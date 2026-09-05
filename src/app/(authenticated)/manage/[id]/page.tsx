import { notFound } from 'next/navigation';
import { queryWithSession } from '@/lib/dal/core/query.server';
import {
  getAdminByIdQuery,
  getAuthProfileQuery,
} from '@/lib/supabase/queries/admins';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { AdminProfileView } from '../../users/[id]/partials/admin/profile-view';

export default async function ManageAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const [adminErr, user] = await queryWithSession(getAdminByIdQuery, id);

  if (adminErr || !user) {
    notFound();
  }

  const orgMembersQuery = new OrganizationMembers();
  const [[profileErr, currentUser], organizationsResult] = await Promise.all([
    queryWithSession(getAuthProfileQuery),
    orgMembersQuery.getOrganizationsWhereUserIsAdmin(id),
  ]);

  const currentUserId =
    profileErr || !currentUser ? null : currentUser.id;
  const organizations =
    organizationsResult.success && Array.isArray(organizationsResult.data)
      ? organizationsResult.data.map((org) => ({
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
