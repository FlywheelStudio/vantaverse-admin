'use client';

import { useMemo } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { useUsers } from '@/hooks/use-users';
import { AddUserMenu } from '../users/users-table/components/add-user-menu';
import { AdminsTable } from './partials/admins-table';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface ManagePageUIProps {
  initialAdmins: ProfileWithStats[];
}

function buildSubtitle(admins: ProfileWithStats[]): string {
  const total = admins.length;
  const pending = admins.filter(
    (admin) => admin.status === 'pending' || admin.status === 'invited',
  ).length;

  const base = `${total} admin${total === 1 ? '' : 's'}`;
  return pending > 0
    ? `${base} · ${pending} invitation${pending === 1 ? '' : 's'} pending`
    : base;
}

export function ManagePageUI({
  initialAdmins,
}: ManagePageUIProps): React.ReactElement {
  const { data: admins, isLoading } = useUsers({ role: 'admin' }, initialAdmins);

  const rows = useMemo(() => admins ?? [], [admins]);
  const subtitle = useMemo(() => buildSubtitle(rows), [rows]);

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Manage' }]}
        title="Manage"
        subtitle={subtitle}
        actions={<AddUserMenu role="admin" />}
      />
      <div className="body">
        <AdminsTable data={rows} isLoading={isLoading} />
      </div>
    </>
  );
}
