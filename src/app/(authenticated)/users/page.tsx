import { getUsersWithStats } from './actions';
import { UsersPageUI } from './ui';

export default async function UsersPage(): Promise<React.ReactElement> {
  const result = await getUsersWithStats({ role: 'patient' });
  const initialUsers = result.success ? result.data : [];

  return <UsersPageUI initialUsers={initialUsers} />;
}
