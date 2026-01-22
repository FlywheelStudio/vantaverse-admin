import { getOrganizationById, getCurrentPhysiologist } from '../actions';
import {
  getOrganizationMembersWithPrograms,
  getOrganizationAdmins,
  getUnassignedUsers,
  type GroupMemberWithProgram,
  type SuperAdminGroupUser,
} from './actions';
import { createParallelQueries } from '@/lib/supabase/query';
import { GroupDetailsPageUI } from './ui';
import { notFound } from 'next/navigation';

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const organization = await getOrganizationById(id);

  if (!organization.success) {
    notFound();
  }

  const isSuperAdminOrg = organization.data.is_super_admin === true;

  let physician = null;
  let members: Array<GroupMemberWithProgram | SuperAdminGroupUser> = [];

  if (isSuperAdminOrg) {
    const {admins, unassigned} = await createParallelQueries({
      admins: {
        query: () => getOrganizationAdmins(id),
        defaultValue: [],
      },
      unassigned: {
        query: () => getUnassignedUsers(),
        defaultValue: [],
      },
    });

    members = [...(admins ?? []), ...(unassigned ?? [])]; 
  } else {
    const result = await createParallelQueries({
      physician: {
        query: () => getCurrentPhysiologist(id),
        defaultValue: null,
      },
      members: {
        query: () => getOrganizationMembersWithPrograms(id),
        defaultValue: [],
      },
    });

    physician = result.physician ?? null;
    members = result.members ?? [];
  }

  return (
    <GroupDetailsPageUI
      organization={organization.data}
      physician={physician}
      initialMembers={members}
    />
  );
}
