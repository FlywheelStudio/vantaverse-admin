import { PageWrapper } from '@/components/page-wrapper';
import { getUsersWithStats } from './actions';
import { UsersPageUI } from './ui';

export default async function UsersPage() {
  const result = await getUsersWithStats({ role: 'patient' });
  const initialUsers = result.success ? result.data : [];

  return (
    <PageWrapper
      subheader={<h1 className="text-2xl font-medium">Members Management</h1>}
    >
      <UsersPageUI initialUsers={initialUsers} />
    </PageWrapper>
  );
}
