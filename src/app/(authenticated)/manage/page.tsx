import { getAdminsFiltered } from './actions';
import { ManagePageUI } from './ui';

export default async function ManagePage(): Promise<React.ReactElement> {
  const result = await getAdminsFiltered({ pageSize: 500 });
  const initialAdmins = result.success ? result.data.data : [];

  return <ManagePageUI initialAdmins={initialAdmins} />;
}
