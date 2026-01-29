import { getOrganizationById, getCurrentPhysiologist } from '../actions';
import {
  getOrganizationMembersWithPrograms,
  type GroupMemberWithProgram,
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
  if (isSuperAdminOrg) {
    notFound();
  }

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

  const physician = result.physician ?? null;
  const members = result.members ?? [];

  return (
    <GroupDetailsPageUI
      organization={organization.data}
      physician={physician}
      initialMembers={members}
    />
  );
}
