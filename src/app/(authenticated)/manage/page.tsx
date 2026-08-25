import { getUsersWithStats } from '../users/actions';
import { ManagePageUI } from './ui';

export default async function ManagePage(): Promise<React.ReactElement> {
  const result = await getUsersWithStats({ role: 'admin' });
  const initialAdmins = result.success ? result.data : [];

  return <ManagePageUI initialAdmins={initialAdmins} />;
}
