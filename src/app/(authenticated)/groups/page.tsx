import { getOrganizations } from './actions';
import { GroupsUI } from './groups/ui';

export default async function GroupsPage(): Promise<React.ReactElement> {
  const result = await getOrganizations();
  const initialOrganizations = result.success ? result.data : [];

  return <GroupsUI initialOrganizations={initialOrganizations} />;
}
