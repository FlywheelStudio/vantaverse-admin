import { useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { useOrganizations } from '@/hooks/use-organizations';
import { useUsersTable } from '../hooks/use-users-table';
import { UsersTableFilters } from './filters';
import { UsersTablePagination } from './pagination';
import { UsersTableBulkBar } from './bulk-bar';
import type { UsersTableProps } from '../types';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

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

  const filteredData = useMemo(
    () => filterByDue(data, dueFilter),
    [data, dueFilter],
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
