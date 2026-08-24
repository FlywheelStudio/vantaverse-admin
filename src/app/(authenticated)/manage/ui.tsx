'use client';

import { useMemo, useState } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';
import { useUsers } from '@/hooks/use-users';
import { AddUserMenu } from '../users/users-table/components/add-user-menu';
import { AdminsTable } from './partials/admins-table';
import { ManageSettingsPanel } from './partials/settings-panel';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface ManagePageUIProps {
  initialAdmins: ProfileWithStats[];
  initialConsultationUrl: string | null;
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
  initialConsultationUrl,
}: ManagePageUIProps): React.ReactElement {
  const { data: admins, isLoading } = useUsers({ role: 'admin' }, initialAdmins);

  const rows = useMemo(() => admins ?? [], [admins]);
  const subtitle = useMemo(() => buildSubtitle(rows), [rows]);

  const [activeTab, setActiveTab] = useState<'admins' | 'settings'>('admins');

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Manage' }]}
        title="Manage"
        subtitle={subtitle}
        actions={<AddUserMenu role="admin" />}
      />
      <div className="body">
        <div className="tabs" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={activeTab === 'admins' ? 'on' : undefined}
            onClick={() => setActiveTab('admins')}
          >
            <Icon name="UsersRound" size={16} />
            Admins
            <span className="cnt">{rows.length}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'settings' ? 'on' : undefined}
            onClick={() => setActiveTab('settings')}
          >
            <Icon name="SlidersHorizontal" size={16} />
            Settings
          </button>
        </div>

        {activeTab === 'admins' ? (
          <AdminsTable data={rows} isLoading={isLoading} />
        ) : null}
        {activeTab === 'settings' ? (
          <ManageSettingsPanel initialConsultationUrl={initialConsultationUrl} />
        ) : null}
      </div>
    </>
  );
}
