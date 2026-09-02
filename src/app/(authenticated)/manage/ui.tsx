'use client';

import { useMemo } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { useAdminsFiltered } from '@/hooks/use-admins';
import { AddUserMenu } from '../users/users-table/components/add-user-menu';
import { AdminsTable } from './partials/admins-table';
import type { AdminProfile } from '@/lib/supabase/schemas/admins';

interface ManagePageUIProps {
  initialAdmins: AdminProfile[];
}

function buildSubtitle(admins: AdminProfile[]): string {
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
  const { data: admins, isLoading } = useAdminsFiltered({}, initialAdmins);

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
