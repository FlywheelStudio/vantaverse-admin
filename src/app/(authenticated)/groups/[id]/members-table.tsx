'use client';

import { useEffect, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, UserPlus } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  getMembersColumns,
  type GroupMemberRow,
} from './members-table/columns';

export function MembersTable({
  data,
  isLoading,
  onAddClick,
  onRemove,
  organizationId,
}: {
  data: GroupMemberRow[];
  isLoading?: boolean;
  onAddClick: () => void;
  onRemove: (userId: string) => Promise<void>;
  organizationId: string;
}) {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'name');
      if (existing && existing.value === debouncedSearch) return prev;
      const filtered = prev.filter((f) => f.id !== 'name');
      return debouncedSearch
        ? [...filtered, { id: 'name', value: debouncedSearch }]
        : filtered;
    });
  }, [debouncedSearch]);

  const columns = getMembersColumns({ onRemove, organizationId });

  const table = useReactTable({
    data,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <Input
            placeholder="Search by name or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Button
            onClick={onAddClick}
            className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add users
          </Button>
        </div>
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
                <td colSpan={columns.length} className="h-24 text-center py-5">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-[#2454FF]" />
                    <span className="text-[#64748B]">Loading members...</span>
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
                <td colSpan={columns.length} className="h-24 text-center py-5">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6 pt-6 border-t border-[#E5E9F0]">
        <div className="flex justify-center md:justify-start">
          <span className="text-sm text-[#64748B]">
            {table.getFilteredRowModel().rows.length} member(s) total.
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
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
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
