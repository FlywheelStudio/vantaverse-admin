'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  IconButton,
  Tooltip,
} from '@/components/medvanta';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { Table } from '@tanstack/react-table';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { AssignGroupModal } from '@/app/(authenticated)/users/[id]/partials/assign-group-modal';
import Link from 'next/link';
import {
  useDeleteUser,
  useToggleSuperAdmin,
  useBulkDeleteUsers,
  useBulkToggleSuperAdmin,
} from '../hooks/use-users-table-mutations';
import { sendBulkInvitations } from '../../actions';
import { MIN_GATES_FOR_PROGRAM_ASSIGNMENT } from '@/lib/supabase/queries/program-assignments';
import toast from 'react-hot-toast';

const sortHeaderClass =
  'flex items-center gap-2 text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] cursor-pointer';

function getStatusTone(
  status: string,
): 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'invited':
      return 'brand';
    case 'active':
    case 'assigned':
      return 'success';
    default:
      return 'neutral';
  }
}

function ProgramDueBadge({
  profile,
}: {
  profile: ProfileWithStats;
}): React.ReactElement | null {
  if (!profile.program_due_date) return null;
  const isOverdue = new Date(profile.program_due_date) < new Date();
  return (
    <Badge tone={isOverdue ? 'danger' : 'warning'}>
      {isOverdue ? 'Overdue' : 'Due'}
    </Badge>
  );
}

function NameEmailCell({ profile }: { profile: ProfileWithStats }) {
  const router = useRouter();
  const fullName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.last_name || 'Unknown';

  return (
    <div
      className="flex cursor-pointer items-center gap-3"
      onClick={() => {
        router.push(`/users/${profile.id}`);
      }}
    >
      <Avatar
        src={profile.avatar_url || undefined}
        name={fullName}
        size="md"
      />
      <div className="min-w-0 max-w-44 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--text-strong)]">
            {fullName}
          </span>
          <ProgramDueBadge profile={profile} />
        </div>
        {profile.email ? (
          <div className="truncate text-[length:var(--text-xs)] text-[var(--text-muted)]">
            {profile.email}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LastLoginCell({ profile }: { profile: ProfileWithStats }) {
  if (!profile.last_sign_in) {
    return <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">—</span>;
  }

  let relativeTime: string | null = null;
  try {
    const date = new Date(profile.last_sign_in);
    relativeTime = formatDistanceToNow(date, { addSuffix: true });
  } catch {
    relativeTime = null;
  }

  if (!relativeTime) {
    return <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">—</span>;
  }

  return (
    <span className="text-[length:var(--text-sm)] text-[var(--text-body)]">
      {relativeTime}
    </span>
  );
}

function GroupsCell({ profile }: { profile: ProfileWithStats }) {
  const orgs = profile.orgMemberships || [];
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  if (orgs.length === 0) {
    const handleAssignSuccess = () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
    };

    return (
      <>
        <Tooltip label="Click to assign group">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-sm)] text-[var(--text-muted)] hover:text-[var(--text-strong)]"
          >
            —
          </button>
        </Tooltip>
        <AssignGroupModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={profile.id}
          onAssignSuccess={handleAssignSuccess}
          userFirstName={profile.first_name}
          userLastName={profile.last_name}
        />
      </>
    );
  }

  const handleGroupClick = (orgId: string) => {
    router.push(`/groups/${orgId}?from=users`);
  };

  const orgNames = orgs.map((org) => org.orgName);
  const displayText =
    orgNames.length > 2
      ? `${orgNames.slice(0, 2).join(', ')}, ...`
      : orgNames.join(', ');

  // If single org, make whole cell clickable
  if (orgs.length === 1) {
    return (
      <button
        type="button"
        onClick={() => handleGroupClick(orgs[0].orgId)}
        className="cursor-pointer truncate text-left text-[length:var(--text-sm)] text-[var(--primary)] hover:underline"
        title={orgNames.join(', ')}
      >
        {displayText}
      </button>
    );
  }

  // Multiple orgs - show clickable names
  return (
    <div className="flex flex-wrap gap-1">
      {orgs.slice(0, 2).map((org, index) => (
        <button
          key={org.orgId}
          type="button"
          onClick={() => handleGroupClick(org.orgId)}
          className="cursor-pointer text-[length:var(--text-sm)] text-[var(--primary)] hover:underline"
        >
          {org.orgName}
          {index < Math.min(orgs.length, 2) - 1 && ', '}
        </button>
      ))}
      {orgs.length > 2 && (
        <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">, ...</span>
      )}
    </div>
  );
}

function ProgramCell({ profile }: { profile: ProfileWithStats }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const hasProgram =
    profile.program_assignment_id && profile.program_assignment_name;
  const hasOrganization = (profile.orgMemberships?.length ?? 0) > 0;
  const canAssignProgram =
    (profile.max_gate_unlocked ?? 0) >= MIN_GATES_FOR_PROGRAM_ASSIGNMENT;

  const handleAssignSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setModalOpen(false);
  };

  if (hasProgram) {
    return (
      <Link
        href={`/builder/${profile.program_assignment_id}?from=users`}
        className="cursor-pointer truncate text-[length:var(--text-sm)] text-[var(--primary)] hover:underline"
      >
        {profile.program_assignment_name}
      </Link>
    );
  }

  if (!canAssignProgram) {
    const gateN = profile.max_gate_unlocked ?? 0;
    return (
      <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
        Gate {gateN}/5
      </span>
    );
  }

  return (
    <>
      <Tooltip
        label={
          hasOrganization
            ? 'Click to assign program'
            : 'Assign a group before assigning a program'
        }
      >
        <span className="inline-flex">
          <button
            type="button"
            onClick={() => hasOrganization && setModalOpen(true)}
            disabled={!hasOrganization}
            className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-sm)] text-[var(--text-muted)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            —
          </button>
        </span>
      </Tooltip>
      {hasOrganization && (
        <AssignProgramModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          userId={profile.id}
          onAssignSuccess={handleAssignSuccess}
          userFirstName={profile.first_name}
          userLastName={profile.last_name}
        />
      )}
    </>
  );
}

function RegistrationCell({ profile }: { profile: ProfileWithStats }) {
  const status = profile.status;
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  if (!status) {
    return <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">—</span>;
  }

  const handleSendInvitation = async (): Promise<void> => {
    if (!profile.email || sending) return;
    
    setSending(true);
    try {
      const result = await sendBulkInvitations([profile.email], false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      
      const { data } = result;
      const successful = data.results.filter((r) => r.success);
      if (successful.length > 0) {
        toast.success('Invitation sent successfully');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setOpen(false);
      } else {
        const failed = data.results.find((r) => !r.success);
        toast.error(failed?.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-pointer border-0 bg-transparent p-0">
          <Badge tone={getStatusTone(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        className="w-auto border-0 bg-transparent p-0 shadow-none"
      >
        <Button
          size="sm"
          onClick={handleSendInvitation}
          disabled={sending}
          loading={sending}
        >
          {sending ? 'Sending...' : 'Re-send Invitation'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function DeleteUserButton({
  profile,
  deleteUserMutation,
}: {
  profile: ProfileWithStats;
  deleteUserMutation: ReturnType<typeof useDeleteUser>;
}) {
  const [open, setOpen] = React.useState(false);

  const handleDelete = async () => {
    try {
      await deleteUserMutation.mutateAsync(profile.id);
      setOpen(false);
    } catch (error) {
      // Error handling is done in mutation hook
      console.error('Error deleting user:', error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <IconButton
          icon="Trash2"
          label="Delete user"
          variant="ghost"
          size="sm"
          className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
        />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &ldquo;{profile.first_name}{' '}
            {profile.last_name}&rdquo;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="cursor-pointer"
            disabled={deleteUserMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            onClick={handleDelete}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActionsCell({ 
  profile, 
  isSelected 
}: { 
  profile: ProfileWithStats;
  isSelected: boolean;
}) {
  const deleteUserMutation = useDeleteUser();
  const toggleSuperAdminMutation = useToggleSuperAdmin();

  const isSuperAdmin = profile.is_super_admin ?? false;

  const handleToggleAdmin = async () => {
    try {
      await toggleSuperAdminMutation.mutateAsync({
        userId: profile.id,
        isSuperAdmin,
      });
    } catch (error) {
      // Error handling is done in mutation hook
      console.error('Error toggling role:', error);
    }
  };

  // Hide individual actions when row is selected (bulk actions will show in header)
  if (isSelected) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip label={isSuperAdmin ? 'Make member' : 'Make admin'}>
        <IconButton
          icon={isSuperAdmin ? 'ShieldOff' : 'Shield'}
          label={isSuperAdmin ? 'Make member' : 'Make admin'}
          variant="ghost"
          size="sm"
          onClick={handleToggleAdmin}
          disabled={toggleSuperAdminMutation.isPending}
          className="text-[var(--primary)] hover:bg-[var(--primary-soft)]"
        />
      </Tooltip>
      <DeleteUserButton
        profile={profile}
        deleteUserMutation={deleteUserMutation}
      />
    </div>
  );
}

function BulkActionsHeader({ table }: { table: Table<ProfileWithStats> }) {
  const queryClient = useQueryClient();
  const bulkDeleteMutation = useBulkDeleteUsers();
  const bulkToggleMutation = useBulkToggleSuperAdmin();
  const [sendingInvites, setSendingInvites] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkToggleOpen, setBulkToggleOpen] = React.useState(false);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedUsers = selectedRows.map((row) => row.original);
  const selectedWithEmail = selectedUsers.filter((user) => user.email);
  const hasSelected = selectedRows.length > 0;
  const hasAnyWithEmail = selectedWithEmail.length > 0;

  const handleBulkInvite = async () => {
    if (!hasAnyWithEmail || sendingInvites) return;

    const emails = selectedWithEmail
      .map((user) => user.email!)
      .filter(Boolean);
    if (emails.length === 0) return;

    setSendingInvites(true);
    try {
      const result = await sendBulkInvitations(emails, false);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const { data } = result;
      const successful = data.results.filter((r) => r.success);
      const failed = data.results.filter((r) => !r.success);

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

  const handleBulkDelete = async () => {
    const userIds = selectedUsers.map((user) => user.id);
    try {
      await bulkDeleteMutation.mutateAsync(userIds);
      setBulkDeleteOpen(false);
      table.resetRowSelection();
    } catch {
      // Error toast handled in mutation
    }
  };

  const handleBulkToggleAdmin = async () => {
    const allAreAdmins = selectedUsers.every((user) => user.is_super_admin);
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
      // Error toast handled in mutation
    }
  };

  const selectedCount = selectedUsers.length;
  const allAreAdmins = selectedUsers.every((user) => user.is_super_admin);

  return (
    <div className="flex items-center gap-2">
      {!hasSelected && (
        <span className="text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
          Actions
        </span>
      )}
      <AnimatePresence>
        {hasSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <Tooltip
              label={
                hasAnyWithEmail
                  ? 'Send/re-send invitations to selected users'
                  : 'Select users to send/re-send invitations'
              }
            >
              <IconButton
                icon="Mail"
                label="Send invitations"
                variant="ghost"
                size="sm"
                onClick={handleBulkInvite}
                disabled={!hasAnyWithEmail || sendingInvites}
                className="text-[var(--primary)] hover:bg-[var(--primary-soft)]"
              />
            </Tooltip>
            <Tooltip label={allAreAdmins ? 'Make members' : 'Make admins'}>
              <IconButton
                icon={allAreAdmins ? 'ShieldOff' : 'Shield'}
                label={allAreAdmins ? 'Make members' : 'Make admins'}
                variant="ghost"
                size="sm"
                onClick={() => setBulkToggleOpen(true)}
                disabled={bulkToggleMutation.isPending}
                className="text-[var(--primary)] hover:bg-[var(--primary-soft)]"
              />
            </Tooltip>
      <AlertDialog open={bulkToggleOpen} onOpenChange={setBulkToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {allAreAdmins ? 'Make Members' : 'Make Admins'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to make {selectedCount} user{selectedCount > 1 ? 's' : ''} {allAreAdmins ? 'members' : 'admins'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={bulkToggleMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleBulkToggleAdmin}
              disabled={bulkToggleMutation.isPending}
            >
              {bulkToggleMutation.isPending
                ? `Updating ${selectedCount} user${selectedCount > 1 ? 's' : ''}...`
                : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} user{selectedCount > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={bulkDeleteMutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending
                ? `Deleting ${selectedCount} user${selectedCount > 1 ? 's' : ''}...`
                : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
            <Tooltip label="Delete selected users">
              <IconButton
                icon="Trash2"
                label="Delete selected users"
                variant="ghost"
                size="sm"
                onClick={() => setBulkDeleteOpen(true)}
                disabled={bulkDeleteMutation.isPending}
                className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
              />
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const columns: ColumnDef<ProfileWithStats>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onChange={(checked) => row.toggleSelected(checked)}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className={sortHeaderClass}
        >
          Name / Email
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[var(--text-strong)]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-strong)]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[var(--text-muted)] opacity-60" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <NameEmailCell profile={row.original} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const profileA = rowA.original;
      const profileB = rowB.original;
      const nameA = profileA.first_name && profileA.last_name
        ? `${profileA.first_name} ${profileA.last_name}`.toLowerCase()
        : profileA.email?.toLowerCase() || '';
      const nameB = profileB.first_name && profileB.last_name
        ? `${profileB.first_name} ${profileB.last_name}`.toLowerCase()
        : profileB.email?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    },
    filterFn: (row, id, value) => {
      const profile = row.original;
      const searchTerm = String(value).toLowerCase();
      const fullName =
        profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : null;
      const displayName = fullName || '';
      const email = profile.email || '';

      return (
        displayName.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm)
      );
    },
  },
  {
    accessorKey: 'last_sign_in',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className={sortHeaderClass}
        >
          Last login
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[var(--text-strong)]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-strong)]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[var(--text-muted)] opacity-60" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <LastLoginCell profile={row.original} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.last_sign_in;
      const dateB = rowB.original.last_sign_in;
      
      // Handle null/undefined values - put them at the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // A is null, put it after B
      if (!dateB) return -1; // B is null, put it after A
      
      // Both have dates, compare them
      const timeA = new Date(dateA).getTime();
      const timeB = new Date(dateB).getTime();
      return timeA - timeB;
    },
  },
  {
    id: 'groups',
    accessorFn: (row) =>
      row.orgMemberships?.map((org) => org.orgName).join(', ') || '',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className={sortHeaderClass}
        >
          Groups
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[var(--text-strong)]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-strong)]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[var(--text-muted)] opacity-60" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <GroupsCell profile={row.original} />,
    enableSorting: true,
    enableColumnFilter: false,
  },
  {
    id: 'program',
    accessorFn: (row) => row.program_assignment_name || '',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className={sortHeaderClass}
        >
          Program
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[var(--text-strong)]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-strong)]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[var(--text-muted)] opacity-60" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <ProgramCell profile={row.original} />,
    enableSorting: true,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className={sortHeaderClass}
        >
          Registration
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[var(--text-strong)]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[var(--text-strong)]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[var(--text-muted)] opacity-60" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <RegistrationCell profile={row.original} />,
    enableSorting: true,
  },
  {
    id: 'is_super_admin',
    accessorFn: (row) => row.is_super_admin ?? false,
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
    filterFn: (row, id, value) => {
      const isSuperAdmin = row.original.is_super_admin ?? false;
      if (value === undefined || value === null) return true;
      return isSuperAdmin === value;
    },
  },
  {
    id: 'actions',
    header: ({ table }) => <BulkActionsHeader table={table} />,
    cell: ({ row }) => (
      <ActionsCell 
        profile={row.original} 
        isSelected={row.getIsSelected()}
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
];
