'use client';

import { useState } from 'react';
import type { Table } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
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
import { sendBulkInvitations } from '../../actions';
import {
  useBulkDeleteUsers,
  useBulkToggleSuperAdmin,
} from '../hooks/use-users-table-mutations';

interface UsersTableBulkBarProps {
  table: Table<ProfileWithStats>;
}

/** HTML `.bulk` selection bar above `.tbl`. */
export function UsersTableBulkBar({
  table,
}: UsersTableBulkBarProps): React.ReactElement | null {
  const queryClient = useQueryClient();
  const bulkDeleteMutation = useBulkDeleteUsers();
  const bulkToggleMutation = useBulkToggleSuperAdmin();
  const [sendingInvites, setSendingInvites] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkToggleOpen, setBulkToggleOpen] = useState(false);

  const selectedUsers = table
    .getFilteredSelectedRowModel()
    .rows.map((row) => row.original);
  const selectedCount = selectedUsers.length;

  if (selectedCount === 0) return null;

  const hasAnyWithEmail = selectedUsers.some((user) => user.email);
  const allAreAdmins = selectedUsers.every((user) => user.is_super_admin);

  const handleBulkInvite = async (): Promise<void> => {
    const emails = selectedUsers
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email));
    if (emails.length === 0) return;

    setSendingInvites(true);
    try {
      const result = await sendBulkInvitations(emails, false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const successful = result.data.results.filter((row) => row.success);
      const failed = result.data.results.filter((row) => !row.success);
      if (successful.length > 0) {
        toast.success(
          `Sent ${successful.length} invitation${successful.length > 1 ? 's' : ''}${failed.length > 0 ? `; ${failed.length} failed` : ''}`,
        );
        queryClient.invalidateQueries({ queryKey: ['users'] });
        table.resetRowSelection();
      } else {
        toast.error(
          `All ${failed.length} invitation${failed.length > 1 ? 's' : ''} failed`,
        );
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast.error('Failed to send invitations');
    } finally {
      setSendingInvites(false);
    }
  };

  const handleBulkDelete = async (): Promise<void> => {
    try {
      await bulkDeleteMutation.mutateAsync(selectedUsers.map((user) => user.id));
      setBulkDeleteOpen(false);
      table.resetRowSelection();
    } catch {
      // handled in mutation
    }
  };

  const handleBulkToggleAdmin = async (): Promise<void> => {
    const targetIsAdmin = !allAreAdmins;
    const userIds = selectedUsers
      .filter((user) => (user.is_super_admin ?? false) !== targetIsAdmin)
      .map((user) => user.id);
    if (userIds.length === 0) {
      setBulkToggleOpen(false);
      table.resetRowSelection();
      return;
    }
    try {
      await bulkToggleMutation.mutateAsync({ userIds, targetIsAdmin });
      setBulkToggleOpen(false);
      table.resetRowSelection();
    } catch {
      // handled in mutation
    }
  };

  return (
    <>
      <div className="bulk">
        <span className="bn">
          {selectedCount} selected
        </span>
        <button type="button" disabled title="Placeholder">
          Assign program
        </button>
        <button type="button" disabled title="Placeholder">
          Add to group
        </button>
        <button
          type="button"
          onClick={handleBulkInvite}
          disabled={!hasAnyWithEmail || sendingInvites}
        >
          {sendingInvites ? 'Sending…' : 'Send invitations'}
        </button>
        <button type="button" disabled title="Placeholder">
          Export
        </button>
        <button
          type="button"
          className="dn"
          onClick={() => setBulkDeleteOpen(true)}
          disabled={bulkDeleteMutation.isPending}
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => setBulkToggleOpen(true)}
          disabled={bulkToggleMutation.isPending}
        >
          {allAreAdmins ? 'Make members' : 'Make admins'}
        </button>
        <span className="sp">
          <button
            type="button"
            style={{ background: 'transparent', borderColor: 'transparent' }}
            onClick={() => table.resetRowSelection()}
          >
            Clear
          </button>
        </span>
      </div>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected users</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} user
              {selectedCount !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkToggleOpen} onOpenChange={setBulkToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {allAreAdmins ? 'Make Members' : 'Make Admins'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Change role for {selectedCount} selected user
              {selectedCount !== 1 ? 's' : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkToggleAdmin}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
