'use client';

import { flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

import { useUsersTable } from '../../users/users-table/hooks/use-users-table';
import { UsersTablePagination } from '../../users/users-table/components/pagination';
import { HtmlSearchField } from '../../users/html-helpers';
import { adminColumns } from './columns';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface AdminsTableProps {
  data: ProfileWithStats[];
  isLoading?: boolean;
}

/**
 * Admins-only table.
 *
 * Deliberately not `UsersTable` — that one hard-wires the Members/Admins role
 * tabs, a program-due-date filter, and a bulk bar that invites as non-admin,
 * none of which apply here.
 */
export function AdminsTable({
  data,
  isLoading = false,
}: AdminsTableProps): React.ReactElement {
  const { table, searchValue, setSearchValue } = useUsersTable({
    columns: adminColumns,
    data,
    filters: { role: 'admin' },
  });

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <div className="tbar">
          <HtmlSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search admins by name or email…"
          />
        </div>
      </div>

      <div className="tw" style={{ overflow: 'visible' }}>
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
                      className={header.column.getCanSort() ? 'srt' : undefined}
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
                    colSpan={adminColumns.length}
                    style={{ textAlign: 'center' }}
                  >
                    <div
                      className="row"
                      style={{ justifyContent: 'center', gap: 8 }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                      <span className="mut">Loading admins…</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
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
                  <td
                    colSpan={adminColumns.length}
                    style={{ textAlign: 'center' }}
                  >
                    <span className="mut">
                      {searchValue
                        ? 'No admins match that search.'
                        : 'No admins yet. Invite one to get started.'}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <UsersTablePagination table={table} noun="admins" />
      </div>
    </>
  );
}
