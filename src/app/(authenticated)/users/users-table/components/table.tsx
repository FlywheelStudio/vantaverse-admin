'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UsersTablePagination } from './pagination';
import { UsersTableBulkBar } from './bulk-bar';
import { useBulkDeleteUsers } from '../hooks/use-users-table-mutations';
import type { UsersTableMeta } from '../types';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface UsersTableProps {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  isLoading?: boolean;
}

const memberDisplayName = (profile: ProfileWithStats): string => {
  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  return profile.first_name || profile.last_name || 'this member';
};

/**
 * Presentational members table.
 *
 * Facet filtering and search live in the parent (`UsersPageUI`) through the
 * `list_profiles_filtered` RPC; this component only sorts and paginates the
 * already-filtered rows client-side. Delete lives here so optimistic cache
 * updates do not unmount the mutation observer with the removed row.
 */
export function UsersTable({
  columns,
  data,
  isLoading = false,
}: UsersTableProps): React.ReactElement {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [memberToRemove, setMemberToRemove] = useState<ProfileWithStats | null>(
    null,
  );
  const deleteUsers = useBulkDeleteUsers();
  const isDeleting = deleteUsers.isPending;

  const handleDeleteUsers = async (userIds: string[]): Promise<void> => {
    await deleteUsers.mutateAsync(userIds);
    setRowSelection({});
    setMemberToRemove(null);
  };

  const handleConfirmRemove = async (): Promise<void> => {
    if (!memberToRemove || isDeleting) return;
    try {
      await handleDeleteUsers([memberToRemove.id]);
    } catch {
      // handled in mutation
    }
  };

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, rowSelection },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    meta: {
      onRemoveMember: setMemberToRemove,
    } satisfies UsersTableMeta,
  });

  return (
    <div className="tw" style={{ overflow: 'visible' }}>
      <UsersTableBulkBar
        table={table}
        onDeleteUsers={handleDeleteUsers}
        isDeleting={isDeleting}
      />
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

      <AlertDialog
        open={memberToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes{' '}
              {memberToRemove ? memberDisplayName(memberToRemove) : 'this member'}
              {memberToRemove?.email ? ` (${memberToRemove.email})` : ''}. Their
              account cannot be recovered. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmRemove();
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
