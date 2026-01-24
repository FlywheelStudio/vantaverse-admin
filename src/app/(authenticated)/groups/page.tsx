import { PageWrapper } from '@/components/page-wrapper';
import { getOrganizations } from './actions';
import { GroupsUI } from './groups/ui';

export default async function GroupsPage() {
  const result = await getOrganizations();
  const initialOrganizations = result.success ? result.data : [];

  return (
    <PageWrapper
      subheader={<h1 className="text-3xl font-semibold tracking-tight text-white">Groups</h1>}
    >
      <GroupsUI initialOrganizations={initialOrganizations} />
    </PageWrapper>
  );
}
