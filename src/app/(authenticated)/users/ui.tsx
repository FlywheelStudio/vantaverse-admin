'use client';

import { useMemo, useState } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { useOrganizations } from '@/hooks/use-organizations';
import { ActiveFilterPills, useFilterDraft } from '@/components/filters';
import type { ActiveFilter } from '@/components/filters';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useMembersFiltered,
  useMemberFilterCounts,
} from '@/hooks/use-users';
import { UsersTableFilters } from './users-table/components/filters';
import {
  DEFAULT_MEMBERS_FILTERS,
  countActiveFilters,
  removeMembersFilter,
  type MembersFilters,
} from './users-table/components/members-filter-panel';
import { UsersTable } from './users-table/components/table';
import { columns } from './users-table/components/columns';
import { AddUserMenu } from './users-table/components/add-user-menu';
import { HtmlMoreButton } from '@/app/(authenticated)/builder/partials/html-toolbar';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface UsersPageUIProps {
  initialUsers: ProfileWithStats[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  invited: 'Invited',
  active: 'Active',
  assigned: 'Assigned',
};

const PROGRAM_LABELS: Record<string, string> = {
  on_program: 'On a program',
  completed: 'Completed a program',
  pre_program: 'Pre-program only',
  not_assigned: 'Not assigned',
};

const LAST_ACTIVE_LABELS: Record<string, string> = {
  '7d': 'Active in last 7 days',
  '30d': 'Active in last 30 days',
  '90d': 'Active in last 90 days',
  never: 'Never signed in',
};

const JOINED_LABELS: Record<string, string> = {
  month: 'Joined this month',
  quarter: 'Joined this quarter',
  year: 'Joined this year',
};

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
  const [role, setRole] = useState<'patient' | 'admin'>('patient');
  const [searchValue, setSearchValue] = useState('');
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});
  const debouncedSearch = useDebounce(searchValue, 300);

  const {
    applied: filters,
    staged,
    setStaged,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    apply: applyFilters,
    clearAll: clearAllDraft,
    removePill: removeFiltersPill,
  } = useFilterDraft<MembersFilters>({
    initial: DEFAULT_MEMBERS_FILTERS,
    removeFilter: removeMembersFilter,
  });

  const { data: organizations } = useOrganizations();
  const { data: counts } = useMemberFilterCounts();

  // Seed the first paint with the SSR patient list while on default filters.
  const isDefaultState =
    role === 'patient' &&
    !debouncedSearch.trim() &&
    countActiveFilters(filters) === 0;

  const {
    data: members,
    isLoading,
  } = useMembersFiltered(
    {
      search: debouncedSearch || undefined,
      role,
      organization_id: filters.organization_id,
      team_id: filters.team_id,
      status: filters.status,
      program: filters.program,
      physiologist: filters.physiologist,
      lastActive: filters.lastActive,
      joined: filters.joined,
      due: filters.due,
    },
    isDefaultState ? initialUsers : undefined,
  );

  const displayUsers = useMemo(() => members ?? [], [members]);
  const subtitle = useMemo(() => buildSubtitle(displayUsers), [displayUsers]);

  const tableColumns = useMemo(
    () => (role === 'admin' ? columns.filter((col) => col.id !== 'program') : columns),
    [role],
  );

  const memberCount = counts?.roles.patient ?? displayUsers.length;
  const adminCount = counts?.roles.admin ?? 0;

  // Staged group selection helpers (names kept for pill + panel labels).
  const handleStagedOrgSelect = (orgId?: string): void => {
    const next: MembersFilters = { ...staged };
    if (orgId) next.organization_id = orgId;
    else delete next.organization_id;
    delete next.team_id;
    setStaged(next);
  };

  const handleStagedTeamSelect = (teamId?: string, teamName?: string): void => {
    if (teamName && teamId) {
      setTeamNames((prev) => ({ ...prev, [teamId]: teamName }));
    }
    const next: MembersFilters = { ...staged, team_id: teamId };
    if (!teamId) delete next.team_id;
    if (next.team_id && !next.organization_id) {
      next.organization_id = staged.organization_id;
    }
    setStaged(next);
  };

  const stagedOrgName =
    organizations?.find((o) => o.id === staged.organization_id)?.name;
  const appliedOrgName =
    organizations?.find((o) => o.id === filters.organization_id)?.name;

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const pills: ActiveFilter[] = [];
    const term = debouncedSearch.trim();
    if (term) pills.push({ id: 'search', label: `"${term}"` });
    if (filters.organization_id) {
      pills.push({ id: 'org', label: appliedOrgName ?? 'Group' });
    }
    if (filters.team_id) {
      pills.push({
        id: 'team',
        label: teamNames[filters.team_id] ?? 'Team',
      });
    }
    if (filters.status !== 'all') {
      pills.push({ id: 'status', label: STATUS_LABELS[filters.status] });
    }
    if (filters.program !== 'all') {
      pills.push({ id: 'program', label: PROGRAM_LABELS[filters.program] });
    }
    if (filters.physiologist) {
      pills.push({ id: 'physiologist', label: filters.physiologist });
    }
    if (filters.lastActive !== 'all') {
      pills.push({ id: 'lastActive', label: LAST_ACTIVE_LABELS[filters.lastActive] });
    }
    if (filters.joined !== 'all') {
      pills.push({ id: 'joined', label: JOINED_LABELS[filters.joined] });
    }
    if (filters.due !== 'all') {
      pills.push({
        id: 'due',
        label: filters.due === 'overdue' ? 'Program overdue' : 'Program due later',
      });
    }
    return pills;
  }, [filters, debouncedSearch, appliedOrgName, teamNames]);

  const handleRemovePill = (id: string): void => {
    if (id === 'search') setSearchValue('');
    else removeFiltersPill(id);
  };

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Members' }]}
        title="Members"
        subtitle={subtitle}
        actions={
          <>
            <AddUserMenu role={role} />
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
        <div style={{ position: 'relative' }}>
          <UsersTableFilters
            role={role}
            onRoleSelect={setRole}
            memberCount={memberCount}
            adminCount={adminCount}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            staged={staged}
            onStagedChange={setStaged}
            activeCount={countActiveFilters(filters)}
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            physiologistOptions={counts?.physiologists ?? []}
            unassignedPhysiologist={counts?.unassigned_physiologist}
            selectedOrgName={stagedOrgName}
            selectedTeamName={
              staged.team_id ? teamNames[staged.team_id] : undefined
            }
            onStagedOrgSelect={handleStagedOrgSelect}
            onStagedTeamSelect={handleStagedTeamSelect}
            onClearAll={clearAllDraft}
            onApply={applyFilters}
          />
        </div>

        <ActiveFilterPills
          pills={activeFilters}
          onRemove={handleRemovePill}
          onClearAll={
            activeFilters.length > 0
              ? () => {
                  setSearchValue('');
                  clearAllDraft();
                }
              : undefined
          }
          meta={`${displayUsers.length} found`}
        />

        <UsersTable
          columns={tableColumns}
          data={displayUsers}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
