'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AppBar } from '@/components/medvanta/shell';
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from './users-table/components/table';
import { columns } from './users-table/components/columns';
import { AddUserMenu } from './users-table/components/add-user-menu';
import { HtmlMoreButton } from '@/app/(authenticated)/builder/partials/html-toolbar';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface UsersPageUIProps {
  initialUsers: ProfileWithStats[];
}

function buildSubtitle(users: ProfileWithStats[]): string {
  const total = users.length;
  const pending = users.filter((user) => user.status === 'pending').length;
  const invited = users.filter((user) => user.status === 'invited').length;
  const invites = pending + invited;
  const orgCount = new Set(
    users.flatMap((user) => user.orgMemberships?.map((org) => org.orgId) ?? []),
  ).size;
  const orgPart =
    orgCount > 0 ? `${total} members across ${orgCount} groups` : `${total} members`;
  return invites > 0
    ? `${orgPart} · ${invites} invitation${invites !== 1 ? 's' : ''} pending`
    : orgPart;
}

export function UsersPageUI({ initialUsers }: UsersPageUIProps): React.ReactElement {
  const [filters, setFilters] = useState<{
    organization_id?: string;
    team_id?: string;
    role: MemberRole;
  }>({ role: 'patient' });

  const sharedFilters = {
    organization_id: filters.organization_id,
    team_id: filters.team_id,
  };
  const hasOrgOrTeam = Boolean(filters.organization_id || filters.team_id);

  // Fetch both roles so Members/Admins tab counts stay correct regardless of active tab.
  const { data: members, isLoading: membersLoading } = useUsers(
    { ...sharedFilters, role: 'patient' },
    !hasOrgOrTeam ? initialUsers : undefined,
  );
  const { data: admins, isLoading: adminsLoading } = useUsers({
    ...sharedFilters,
    role: 'admin',
  });

  const memberCount = members?.length ?? 0;
  const adminCount = admins?.length ?? 0;
  const displayUsers = useMemo(
    () => (filters.role === 'admin' ? admins : members) ?? [],
    [filters.role, members, admins],
  );
  const isLoading =
    filters.role === 'admin' ? adminsLoading : membersLoading;
  const subtitle = useMemo(() => buildSubtitle(displayUsers), [displayUsers]);

  const tableColumns = useMemo(
    () =>
      filters.role === 'admin'
        ? columns.filter((col) => col.id !== 'program')
        : columns,
    [filters.role],
  );

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Members' }]}
        title="Members"
        subtitle={subtitle}
        actions={
          <>
            <AddUserMenu role={filters.role} />
            <HtmlMoreButton
              items={[
                {
                  id: 'import',
                  label: 'Import from CSV',
                  onSelect: () => toastUnavailable('Import from CSV'),
                },
                {
                  id: 'export',
                  label: 'Export all',
                  onSelect: () => toastUnavailable('Export all'),
                },
                {
                  id: 'columns',
                  label: 'Choose columns',
                  onSelect: () => toastUnavailable('Choose columns'),
                },
                {
                  id: 'admins',
                  label: 'Manage admins',
                  onSelect: () => toastUnavailable('Manage admins'),
                },
              ]}
            />
          </>
        }
      />
      <div className="body">
        {isLoading ? (
          <div className="empty">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
            <span className="es">Loading members…</span>
          </div>
        ) : (
          <UsersTable
            columns={tableColumns}
            data={displayUsers}
            filters={filters}
            onFiltersChange={setFilters}
            memberCount={memberCount}
            adminCount={adminCount}
          />
        )}
      </div>
    </>
  );
}
