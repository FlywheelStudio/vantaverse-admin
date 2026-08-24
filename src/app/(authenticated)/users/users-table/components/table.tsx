'use client';

import { useState } from 'react';
import { flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type SortingState, type ColumnDef } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

import { UsersTablePagination } from './pagination';
import { UsersTableBulkBar } from './bulk-bar';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface UsersTableProps {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  isLoading?: boolean;
}

/**
 * Presentational members table.
 *
 * Facet filtering and search live in the parent (`UsersPageUI`) through the
 * `list_profiles_filtered` RPC; this component only sorts and paginates the
 * already-filtered rows client-side.
 */
export function UsersTable({
  columns,
  data,
  isLoading = false,
}: UsersTableProps): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
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
                  <span className="mut">No results.</span>
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
