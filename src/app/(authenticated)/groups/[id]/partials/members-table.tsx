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
import { Icon } from '@/components/medvanta';
import { HtmlSearchField } from '../../partials/html-search-field';
import { HtmlTableFooter } from '../../partials/html-table-footer';
import {
  getMembersColumns,
  type GroupMemberRow,
} from './members-table-columns';
import type { UseMutationResult } from '@tanstack/react-query';

export function MembersTable({
  data,
  isLoading,
  removeMemberMutation,
  addAdminMutation,
  removeAdminMutation,
  isSuperAdminOrg,
  organizationId,
}: {
  data: GroupMemberRow[];
  isLoading?: boolean;
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  addAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  removeAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  isSuperAdminOrg?: boolean;
  organizationId: string;
}): React.ReactElement {
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
    initialState: { pagination: { pageSize: 10 } },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <>
      <div className="tbar">
        <HtmlSearchField
          placeholder="Search members in this group…"
          value={searchValue}
          onChange={setSearchValue}
        />
      </div>

      <div className="tw">
        <table className="tbl">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
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
                <td colSpan={columns.length} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  <span className="row" style={{ gap: 8, justifyContent: 'center' }}>
                    <Icon name="LoaderCircle" size={18} className="animate-spin" />
                    Loading members…
                  </span>
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <HtmlTableFooter
          summary={
            <>
              Showing{' '}
              <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-body)' }}>
                {filteredCount}
              </b>{' '}
              member{filteredCount === 1 ? '' : 's'}
            </>
          }
          page={table.getState().pagination.pageIndex + 1}
          pageCount={Math.max(table.getPageCount(), 1)}
          onPageChange={(nextPage) => table.setPageIndex(nextPage - 1)}
        />
      </div>
    </>
  );
}
