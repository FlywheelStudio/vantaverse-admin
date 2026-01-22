import { getOrganizationById, getCurrentPhysiologist } from '../actions';
import {
  getOrganizationMembersWithPrograms,
  getOrganizationAdmins,
  getUnassignedUsers,
} from './actions';
import { createParallelQueries } from '@/lib/supabase/query';
import { GroupDetailsPageUI } from './ui';

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const base = await createParallelQueries({
    organization: {
      query: () => getOrganizationById(id),
      required: true,
    },
  });

  // Ensure all props are safe before rendering
  if (!base.organization) {
    throw new Error('Organization data is required');
  }

  const isSuperAdminOrg = base.organization.is_super_admin === true;

  const data = isSuperAdminOrg
    ? await createParallelQueries({
        admins: {
          query: () => getOrganizationAdmins(id),
          defaultValue: [],
        },
        unassigned: {
          query: () => getUnassignedUsers(),
          defaultValue: [],
        },
      })
    : await createParallelQueries({
        physician: {
          query: () => getCurrentPhysiologist(id),
          defaultValue: null,
        },
        members: {
          query: () => getOrganizationMembersWithPrograms(id),
          defaultValue: [],
        },
      });

  const safePhysician =
    !isSuperAdminOrg && 'physician' in data ? data.physician ?? null : null;

  const safeMembers = isSuperAdminOrg
    ? [
        ...('admins' in data && Array.isArray(data.admins) ? data.admins : []),
        ...('unassigned' in data && Array.isArray(data.unassigned)
          ? data.unassigned
          : []),
      ]
    : 'members' in data && Array.isArray(data.members)
      ? data.members
      : [];

  return (
    <GroupDetailsPageUI
      organization={base.organization}
      physician={safePhysician}
      initialMembers={safeMembers}
    />
  );
}
