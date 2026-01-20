import { getOrganizationById, getCurrentPhysiologist } from '../actions';
import { getOrganizationMembersWithPrograms } from './actions';
import { createParallelQueries } from '@/lib/supabase/query';
import { GroupDetailsPageUI } from './ui';

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const data = await createParallelQueries({
    organization: {
      query: () => getOrganizationById(id),
      required: true,
    },
    physician: {
      query: () => getCurrentPhysiologist(id),
      defaultValue: null,
    },
    members: {
      query: () => getOrganizationMembersWithPrograms(id),
      defaultValue: [],
    },
  });

  return (
    <GroupDetailsPageUI
      organization={data.organization}
      physician={data.physician}
      initialMembers={data.members}
    />
  );
}
