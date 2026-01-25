import { useMemo, useState } from 'react';
import { flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOrganizations } from '@/hooks/use-organizations';
import { useUsersTable } from '../hooks/use-users-table';
import { UsersTableFilters } from './filters';
import { UsersTablePagination } from './pagination';
import type { UsersTableProps } from '../types';

export function UsersTable({
  columns,
  data,
  filters = { role: 'patient' },
  onFiltersChange,
  isLoading = false,
}: UsersTableProps) {
  const { data: organizations } = useOrganizations();
  const [selectedTeamName, setSelectedTeamName] = useState<
    string | undefined
  >();

  const { table, searchValue, setSearchValue } = useUsersTable({
    columns,
    data,
    filters,
  });

  // Compute org name from filters (derived state)
  const selectedOrgName = useMemo(() => {
    if (filters.organization_id && organizations) {
      const org = organizations.find((o) => o.id === filters.organization_id);
      return org?.name;
    }
    return undefined;
  }, [filters.organization_id, organizations]);

  const handleTeamNameChange = (name: string | undefined) => {
    setSelectedTeamName(name);
  };

  // Get filter display names for empty state
  const emptyStateMessage =
    filters.team_id && selectedTeamName
      ? `No members assigned to this team`
      : filters.organization_id && selectedOrgName
        ? `No members assigned to this organization`
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
      />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border bg-muted/40"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground"
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
                <td
                  colSpan={columns.length}
                  className="h-24 text-center py-5 px-4"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-muted-foreground">
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
                  className={`border-b border-border hover:bg-muted/40 transition-colors ${index === array.length - 1 ? 'border-b-0' : ''}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-5 px-4">
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
                <td
                  colSpan={columns.length}
                  className="h-24 text-center py-5 px-4"
                >
                  <span className="text-sm text-muted-foreground">
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
