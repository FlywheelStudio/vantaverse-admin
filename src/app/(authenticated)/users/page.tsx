import { getMemberFilterCounts, getUsersWithStats } from './actions';
import { UsersPageUI } from './ui';

export default async function UsersPage(): Promise<React.ReactElement> {
  const [usersResult, countsResult] = await Promise.all([
    getUsersWithStats({ role: 'patient' }),
    getMemberFilterCounts(),
  ]);
  const initialUsers = usersResult.success ? usersResult.data : [];
  const initialCounts = countsResult.success ? countsResult.data : undefined;

  return (
    <UsersPageUI initialUsers={initialUsers} initialCounts={initialCounts} />
  );
}
