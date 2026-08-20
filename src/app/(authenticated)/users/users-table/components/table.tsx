import { useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useUsersTable } from '../hooks/use-users-table';
import { UsersTableFilters } from './filters';
import {
  DEFAULT_MEMBERS_EXTRA_FILTERS,
  type MembersExtraFilters,
} from './members-filter-panel';
import { UsersTablePagination } from './pagination';
import { UsersTableBulkBar } from './bulk-bar';
import type { UsersTableProps } from '../types';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Organization } from '@/lib/supabase/schemas/organizations';

type DueFilter = 'all' | 'due' | 'overdue';

function getDueStatus(profile: ProfileWithStats): 'none' | 'due' | 'overdue' {
  if (!profile.program_due_date) return 'none';
  return new Date(profile.program_due_date) < new Date() ? 'overdue' : 'due';
}

function filterByDue(
  rows: ProfileWithStats[],
  dueFilter: DueFilter,
): ProfileWithStats[] {
  if (dueFilter === 'all') return rows;
  return rows.filter((profile) => getDueStatus(profile) === dueFilter);
}

/** Same derivation as the Groups page's real Physiologist filter (org admin). */
function physiologistNameForOrg(org: Organization): string | null {
  const admin = org.members?.find((m) => m.role === 'admin');
  if (!admin?.profile) return null;
  return (
    [admin.profile.first_name, admin.profile.last_name]
      .filter(Boolean)
      .join(' ') ||
    admin.profile.email ||
    null
  );
}

function getProgramStatus(
  profile: ProfileWithStats,
): 'on_program' | 'completed' | 'pre_program' | 'not_assigned' {
  if (profile.program_assigned) {
    return (profile.program_completion_percentage ?? 0) >= 100
      ? 'completed'
      : 'on_program';
  }
  return profile.consultation_completed ? 'pre_program' : 'not_assigned';
}

function matchesJoinedFilter(
  createdAt: string | null,
  joined: MembersExtraFilters['joined'],
): boolean {
  if (joined === 'all') return true;
  if (!createdAt) return false;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;
  const now = new Date();
  if (joined === 'month') {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  }
  if (joined === 'quarter') {
    const quarterStart = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );
    return created >= quarterStart;
  }
  return created.getFullYear() === now.getFullYear();
}

function filterByExtra(
  rows: ProfileWithStats[],
  extra: MembersExtraFilters,
  physiologistByOrgId: Map<string, string | null>,
): ProfileWithStats[] {
  return rows.filter((profile) => {
    if (extra.status !== 'all' && profile.status !== extra.status) return false;
    if (extra.program !== 'all' && getProgramStatus(profile) !== extra.program) {
      return false;
    }
    if (extra.physiologist) {
      const orgId = profile.orgMemberships?.[0]?.orgId;
      const name = orgId ? physiologistByOrgId.get(orgId) : null;
      if (extra.physiologist === 'Unassigned') {
        if (name) return false;
      } else if (name !== extra.physiologist) {
        return false;
      }
    }
    if (extra.lastActive !== 'all') {
      if (extra.lastActive === 'never') {
        if (profile.last_sign_in) return false;
      } else {
        const days =
          extra.lastActive === '7d' ? 7 : extra.lastActive === '30d' ? 30 : 90;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (
          !profile.last_sign_in ||
          new Date(profile.last_sign_in).getTime() < cutoff
        ) {
          return false;
        }
      }
    }
    if (!matchesJoinedFilter(profile.created_at, extra.joined)) return false;
    return true;
  });
}

export function UsersTable({
  columns,
  data,
  filters = { role: 'patient' },
  onFiltersChange,
  isLoading = false,
  memberCount,
  adminCount,
}: UsersTableProps): React.ReactElement {
  const { data: organizations } = useOrganizations();
  const [selectedTeamName, setSelectedTeamName] = useState<
    string | undefined
  >();
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [extraFilters, setExtraFilters] = useState<MembersExtraFilters>(
    DEFAULT_MEMBERS_EXTRA_FILTERS,
  );

  const physiologistByOrgId = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const org of organizations ?? []) {
      map.set(org.id, physiologistNameForOrg(org));
    }
    return map;
  }, [organizations]);

  const physiologistOptions = useMemo(() => {
    const counts = new Map<string, number>();
    let unassigned = 0;
    for (const profile of data) {
      const orgId = profile.orgMemberships?.[0]?.orgId;
      const name = orgId ? physiologistByOrgId.get(orgId) : null;
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
      else unassigned += 1;
    }
    const opts = [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
    if (unassigned > 0) opts.push({ label: 'Unassigned', count: unassigned });
    return opts;
  }, [data, physiologistByOrgId]);

  const filteredData = useMemo(
    () =>
      filterByExtra(
        filterByDue(data, dueFilter),
        extraFilters,
        physiologistByOrgId,
      ),
    [data, dueFilter, extraFilters, physiologistByOrgId],
  );

  const { table, searchValue, setSearchValue } = useUsersTable({
    columns,
    data: filteredData,
    filters,
  });

  const selectedOrgName = useMemo(() => {
    if (filters.organization_id && organizations) {
      const org = organizations.find((o) => o.id === filters.organization_id);
      return org?.name;
    }
    return undefined;
  }, [filters.organization_id, organizations]);

  const handleTeamNameChange = (name: string | undefined): void => {
    setSelectedTeamName(name);
  };

  const emptyStateMessage =
    filters.team_id && selectedTeamName
      ? 'No members assigned to this team'
      : filters.organization_id && selectedOrgName
        ? 'No members assigned to this organization'
        : dueFilter !== 'all'
          ? `No ${dueFilter} members.`
          : 'No results.';

  return (
    <>
      <UsersTableFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        selectedOrgName={selectedOrgName}
        selectedTeamName={selectedTeamName}
        onFiltersChange={onFiltersChange}
        onTeamNameChange={handleTeamNameChange}
        memberCount={memberCount}
        adminCount={adminCount}
        dueFilter={dueFilter}
        onDueFilterChange={setDueFilter}
        extraFilters={extraFilters}
        onExtraFiltersChange={setExtraFilters}
        physiologistOptions={physiologistOptions}
      />

      <div className="tw" style={{ overflow: 'visible' }}>
        <UsersTableBulkBar table={table} />
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={
                        header.id === 'select'
                          ? { width: 40 }
                          : header.id === 'actions'
                            ? { textAlign: 'right', width: 52 }
                            : undefined
                      }
                      className={
                        header.column.getCanSort() ? 'srt' : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                    <div className="row" style={{ justifyContent: 'center', gap: 8 }}>
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                      <span className="mut">Loading members…</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={row.getIsSelected() ? 'sel-row' : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={
                          cell.column.id === 'actions'
                            ? { textAlign: 'right', width: 52 }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                    <span className="mut">{emptyStateMessage}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <UsersTablePagination table={table} />
      </div>
    </>
  );
}
