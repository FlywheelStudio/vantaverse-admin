import { notFound } from 'next/navigation';
import { getOrganizationById, getCurrentPhysiologist } from '../actions';
import { getOrganizationMembersWithPrograms } from './actions';
import { GroupDetailsPageUI } from './ui';

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [orgResult, physicianResult, membersResult] = await Promise.all([
    getOrganizationById(id),
    getCurrentPhysiologist(id),
    getOrganizationMembersWithPrograms(id),
  ]);

  if (!orgResult.success) {
    notFound();
  }

  const physician = physicianResult.success ? physicianResult.data : null;
  const members = membersResult.success ? membersResult.data : [];

  return (
    <GroupDetailsPageUI
      organization={orgResult.data}
      physician={physician}
      initialMembers={members}
    />
  );
}
