import { useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrganizations } from '@/hooks/use-organizations';
import { useUsersTable } from '../hooks/use-users-table';
import { UsersTableFilters } from './filters';
import { UsersTablePagination } from './pagination';
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
    <div className="flex flex-col gap-6">
      <UsersTableFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        filters={filters}
        selectedOrgName={selectedOrgName}
        selectedTeamName={selectedTeamName}
        onFiltersChange={onFiltersChange}
        onTeamNameChange={handleTeamNameChange}
        data={data}
        dueFilter={dueFilter}
        onDueFilterChange={setDueFilter}
      />
      <div className="w-full overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)]">
        <table className="w-full border-collapse text-[length:var(--text-md)]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="whitespace-nowrap border-b border-[var(--border-subtle)] bg-[var(--slate-50)] px-4 py-3 text-left text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]"
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
                <td colSpan={columns.length} className="px-4 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                    <span className="text-[var(--text-muted)]">
                      Loading members...
                    </span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, array) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.03,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="transition-[background] duration-[var(--dur-fast)] hover:bg-[var(--slate-50)]"
                  style={{
                    borderBottom:
                      index < array.length - 1
                        ? '1px solid var(--border-subtle)'
                        : undefined,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-[13px] align-middle text-[var(--text-body)]"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-5 text-center">
                  <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                    {emptyStateMessage}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <UsersTablePagination table={table} />
    </div>
  );
}
