import { useEffect, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOrganizations } from '@/hooks/use-organizations';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { OrgTeamFilter } from './org-team-filter';
import { JourneyPhaseFilter } from './journey-phase-filter';
import { ImportMenu } from './import-menu';

interface UsersTableProps {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
  };
  onFiltersChange?: (filters: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
  }) => void;
  isLoading?: boolean;
}

export function UsersTable({
  columns,
  data,
  filters = {},
  onFiltersChange,
  isLoading = false,
}: UsersTableProps) {
  const isMobile = useIsMobile();
  const { data: organizations } = useOrganizations();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedOrgName, setSelectedOrgName] = useState<string | undefined>();
  const [selectedTeamName, setSelectedTeamName] = useState<
    string | undefined
  >();

  useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'name');
      if (existing && existing.value === debouncedSearch) {
        return prev;
      }
      const filtered = prev.filter((f) => f.id !== 'name');
      return debouncedSearch
        ? [...filtered, { id: 'name', value: debouncedSearch }]
        : filtered;
    });
  }, [debouncedSearch]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Update journey_phase filter in table when prop changes
  useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'journey_phase');
      if (existing && existing.value === filters.journey_phase) {
        return prev;
      }
      const filtered = prev.filter((f) => f.id !== 'journey_phase');
      return filters.journey_phase
        ? [...filtered, { id: 'journey_phase', value: filters.journey_phase }]
        : filtered;
    });
  }, [filters.journey_phase]);

  // Update org name when org filter changes
  useEffect(() => {
    if (filters.organization_id) {
      const org = organizations?.find((o) => o.id === filters.organization_id);
      setSelectedOrgName(org?.name);
    } else {
      setSelectedOrgName(undefined);
    }
  }, [filters.organization_id, organizations]);

  // Clear team name when team filter is cleared
  useEffect(() => {
    if (!filters.team_id) {
      setSelectedTeamName(undefined);
    }
  }, [filters.team_id]);

  // Get filter display names for empty state
  const emptyStateMessage =
    filters.team_id && selectedTeamName
      ? `No users assigned to this team`
      : filters.organization_id && selectedOrgName
        ? `No users assigned to this organization`
        : 'No results.';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row gap-4 mb-6 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <Input
            placeholder="Search users..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-white border-[#2454FF]/20 rounded-xl placeholder:text-[#64748B]/60 focus:border-[#2454FF] focus:ring-[#2454FF] flex-1"
          />
        </div>
        <OrgTeamFilter
          selectedOrgId={filters.organization_id}
          selectedOrgName={selectedOrgName}
          selectedTeamId={filters.team_id}
          selectedTeamName={selectedTeamName}
          onOrgSelect={(orgId, orgName) => {
            setSelectedOrgName(orgName);
            setSelectedTeamName(undefined);
            const newFilters: {
              organization_id?: string;
              team_id?: string;
              journey_phase?: string;
            } = {
              ...(orgId && { organization_id: orgId }),
              ...(filters.journey_phase && {
                journey_phase: filters.journey_phase,
              }),
            };
            onFiltersChange?.(newFilters);
          }}
          onTeamSelect={(teamId, teamName) => {
            setSelectedTeamName(teamName);
            const newFilters: {
              organization_id?: string;
              team_id?: string;
              journey_phase?: string;
            } = {
              ...(filters.organization_id && {
                organization_id: filters.organization_id,
              }),
              ...(teamId && { team_id: teamId }),
              ...(filters.journey_phase && {
                journey_phase: filters.journey_phase,
              }),
            };
            onFiltersChange?.(newFilters);
          }}
          onClear={() => {
            setSelectedOrgName(undefined);
            setSelectedTeamName(undefined);
            const newFilters: {
              organization_id?: string;
              team_id?: string;
              journey_phase?: string;
            } = {
              ...(filters.journey_phase && {
                journey_phase: filters.journey_phase,
              }),
            };
            onFiltersChange?.(newFilters);
          }}
        />
        <JourneyPhaseFilter
          selectedPhase={filters.journey_phase}
          onPhaseSelect={(phase) => {
            onFiltersChange?.({ ...filters, journey_phase: phase });
          }}
        />
        <ImportMenu />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b-2 border-[#2454FF]/20"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left py-4 px-4 text-sm font-bold text-[#1E3A5F]"
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
                    <Loader2 className="h-5 w-5 animate-spin text-[#2454FF]" />
                    <span className="text-[#64748B]">Loading users...</span>
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
                  className={`border-b border-[#E5E9F0] hover:bg-[#F5F7FA]/50 transition-colors ${
                    index === array.length - 1 ? 'border-b-0' : ''
                  }`}
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
                  {emptyStateMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6 pt-6 border-t border-[#E5E9F0]">
        <div className="flex justify-center md:justify-start">
          <span className="text-sm text-[#64748B]">
            {table.getFilteredRowModel().rows.length} user(s) total.
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-[#64748B] border-[#E5E9F0] rounded-lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="px-4 py-2 bg-[#2454FF]/10 text-[#2454FF] rounded-lg font-medium text-sm">
            {isMobile
              ? `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
              : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-[#64748B] border-[#E5E9F0] rounded-lg"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
