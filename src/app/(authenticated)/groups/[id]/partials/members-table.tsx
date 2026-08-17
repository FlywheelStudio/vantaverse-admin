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
import { useDebounce } from '@/hooks/use-debounce';
import { Button, Icon, Input, Pagination } from '@/components/medvanta';
import {
  getMembersColumns,
  type GroupMemberRow,
} from './members-table-columns';
import type { UseMutationResult } from '@tanstack/react-query';

export function MembersTable({
  data,
  isLoading,
  onAddClick,
  removeMemberMutation,
  addAdminMutation,
  removeAdminMutation,
  isSuperAdminOrg,
  organizationId,
}: {
  data: GroupMemberRow[];
  isLoading?: boolean;
  onAddClick: () => void;
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  addAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  removeAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  isSuperAdminOrg?: boolean;
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

  const columns = getMembersColumns({
    removeMemberMutation:
      isSuperAdminOrg && removeAdminMutation ? removeAdminMutation : removeMemberMutation,
    addAdminMutation,
    isSuperAdminOrg,
    organizationId,
  });

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
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search by name or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          iconLeft="Search"
          className="min-w-[220px] flex-1"
        />
        <Button onClick={onAddClick} iconLeft="UserPlus" className="shrink-0">
          Add users
        </Button>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)]">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border-subtle)]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 py-5 text-center">
                  <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
                    <Icon name="LoaderCircle" size={20} className="animate-spin" />
                    Loading members...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, array) => (
                <tr
                  key={row.id}
                  className={`border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--slate-50)] ${
                    index === array.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 py-5 text-center text-[var(--text-muted)]">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--border-subtle)] pt-4 md:flex-row md:items-center md:justify-between">
        <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
          {table.getFilteredRowModel().rows.length} member(s) total.
        </span>
        <Pagination
          page={table.getState().pagination.pageIndex + 1}
          pageCount={Math.max(table.getPageCount(), 1)}
          onChange={(nextPage) => table.setPageIndex(nextPage - 1)}
        />
      </div>
    </div>
  );
}
