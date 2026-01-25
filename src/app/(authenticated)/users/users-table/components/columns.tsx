'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Shield, ShieldOff, ChevronUp, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { AssignGroupModal } from '@/app/(authenticated)/users/[id]/partials/assign-group-modal';
import Link from 'next/link';
import {
  useDeleteUser,
  useToggleSuperAdmin,
} from '../hooks/use-users-table-mutations';
import { sendBulkInvitations } from '../../actions';
import toast from 'react-hot-toast';

function NameEmailCell({ profile }: { profile: ProfileWithStats }) {
  const router = useRouter();
  const fullName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null;

  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => {
        router.push(`/users/${profile.id}`);
      }}
    >
      <div className="size-10 shrink-0 flex items-center justify-center">
        <Avatar
          src={profile.avatar_url || null}
          firstName={profile.first_name || ''}
          lastName={profile.last_name || ''}
          userId={profile.id}
          size={40}
        />
      </div>
      <div className="flex-1 min-w-0 max-w-44">
        <div className="font-medium text-sm text-foreground truncate">
          {fullName || 'Unknown'}
        </div>
        {profile.email && (
          <div className="text-xs text-muted-foreground truncate">
            {profile.email}
          </div>
        )}
      </div>
    </div>
  );
}

function LastLoginCell({ profile }: { profile: ProfileWithStats }) {
  if (!profile.last_sign_in) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  let relativeTime: string | null = null;
  try {
    const date = new Date(profile.last_sign_in);
    relativeTime = formatDistanceToNow(date, { addSuffix: true });
  } catch {
    relativeTime = null;
  }

  if (!relativeTime) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return <span className="text-sm text-foreground">{relativeTime}</span>;
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
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
            >
              —
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to assign group</p>
          </TooltipContent>
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
        className="text-sm text-primary hover:underline cursor-pointer truncate text-left"
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
          className="text-sm text-primary hover:underline cursor-pointer"
        >
          {org.orgName}
          {index < Math.min(orgs.length, 2) - 1 && ', '}
        </button>
      ))}
      {orgs.length > 2 && (
        <span className="text-sm text-muted-foreground">, ...</span>
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

  const handleAssignSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    setModalOpen(false);
  };

  if (hasProgram) {
    return (
      <Link
        href={`/builder/${profile.program_assignment_id}?from=users`}
        className="text-sm text-primary hover:underline cursor-pointer truncate"
      >
        {profile.program_assignment_name}
      </Link>
    );
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <button
              type="button"
              onClick={() => hasOrganization && setModalOpen(true)}
              disabled={!hasOrganization}
              className="text-sm text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              —
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {hasOrganization
              ? 'Click to assign program'
              : 'Assign a group before assigning a program'}
          </p>
        </TooltipContent>
      </Tooltip>
      <AssignProgramModal
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

function RegistrationCell({ profile }: { profile: ProfileWithStats }) {
  const status = profile.status;
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  if (!status) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const getBadgeClasses = () => {
    switch (status) {
      case 'pending':
        return 'bg-[oklch(0.95_0.05_55)] text-[oklch(0.34_0.14_55)] border-[oklch(0.9_0.1_55)]';
      case 'invited':
        return 'bg-[oklch(0.95_0.03_262.705)] text-[oklch(0.42_0.2_262.705)] border-[oklch(0.86_0.085_262.705)]';
      case 'active':
      case 'assigned':
        return 'bg-[oklch(0.94_0.04_155)] text-[oklch(0.32_0.12_155)] border-[oklch(0.87_0.1_155)]';
      default:
        return 'bg-muted text-foreground border-border';
    }
  };

  const handleSendInvitation = async () => {
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
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const isPending = status === 'pending';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className={cn(
            getBadgeClasses(),
            isPending ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
          )}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </PopoverTrigger>
      {isPending && (
        <PopoverContent 
          side="bottom" 
          className="w-auto p-0 bg-transparent border-0 shadow-none"
        >
          <button
            type="button"
            onClick={handleSendInvitation}
            disabled={sending}
            className="dropdown-item-animate cursor-pointer left-1/2 translate-x-1/2 text-xs font-medium px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {sending ? 'Sending...' : 'Send Invitation'}
          </button>
        </PopoverContent>
      )}
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
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold cursor-pointer rounded-[var(--radius-pill)]"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
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

function ActionsCell({ profile }: { profile: ProfileWithStats }) {
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

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleAdmin}
            disabled={toggleSuperAdminMutation.isPending}
            className="text-primary hover:bg-primary/10 font-semibold cursor-pointer disabled:opacity-50 rounded-[var(--radius-pill)]"
          >
            {isSuperAdmin ? (
              <ShieldOff className="h-4 w-4" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isSuperAdmin ? 'Make member' : 'Make physician'}
        </TooltipContent>
      </Tooltip>
      <DeleteUserButton
        profile={profile}
        deleteUserMutation={deleteUserMutation}
      />
    </div>
  );
}

export const columns: ColumnDef<ProfileWithStats>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Name / Email
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-foreground" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
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
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Last login
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-foreground" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
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
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Groups
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-foreground" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
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
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Program
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-foreground" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
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
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Registration
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-foreground" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground/60" />
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
    header: () => (
      <span className="text-xs font-semibold tracking-wide">Actions</span>
    ),
    cell: ({ row }) => <ActionsCell profile={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
];
