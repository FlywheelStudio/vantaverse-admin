'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Shield, ShieldOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
import { deleteUser, makeSuperAdmin, revokeSuperAdmin } from '../../actions';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
        <div className="font-medium text-sm text-[#1E3A5F] truncate">
          {fullName || 'Unknown'}
        </div>
        {profile.email && (
          <div className="text-xs text-[#64748B] truncate">{profile.email}</div>
        )}
      </div>
    </div>
  );
}

function LastLoginCell({ profile }: { profile: ProfileWithStats }) {
  if (!profile.last_sign_in) {
    return <span className="text-[#64748B] text-sm">—</span>;
  }

  let relativeTime: string | null = null;
  try {
    const date = new Date(profile.last_sign_in);
    relativeTime = formatDistanceToNow(date, { addSuffix: true });
  } catch {
    relativeTime = null;
  }

  if (!relativeTime) {
    return <span className="text-[#64748B] text-sm">—</span>;
  }

  return <span className="text-sm text-[#1E3A5F]">{relativeTime}</span>;
}

function GroupsCell({ profile }: { profile: ProfileWithStats }) {
  const orgs = profile.orgMemberships || [];
  if (orgs.length === 0) {
    return <span className="text-[#64748B] text-sm">—</span>;
  }

  const orgNames = orgs.map((org) => org.orgName);
  const displayText =
    orgNames.length > 2
      ? `${orgNames.slice(0, 2).join(', ')}, ...`
      : orgNames.join(', ');

  return (
    <span
      className="text-sm text-[#1E3A5F] truncate"
      title={orgNames.join(', ')}
    >
      {displayText}
    </span>
  );
}

function RegistrationCell({ profile }: { profile: ProfileWithStats }) {
  const status = profile.status;
  if (!status) {
    return <span className="text-[#64748B] text-sm">—</span>;
  }

  const getBadgeClasses = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 hover:text-yellow-800';
      case 'invited':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 hover:text-blue-800';
      case 'active':
      case 'assigned':
        return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100 hover:text-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100 hover:text-gray-800';
    }
  };

  return (
    <Badge variant="outline" className={`${getBadgeClasses()} cursor-default`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function DeleteUserButton({
  profile,
  onDelete,
}: {
  profile: ProfileWithStats;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(profile.id);
      setOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold cursor-pointer"
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
          <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActionsCell({ profile }: { profile: ProfileWithStats }) {
  const queryClient = useQueryClient();
  const [isTogglingAdmin, setIsTogglingAdmin] = React.useState(false);

  const isSuperAdmin = profile.is_super_admin ?? false;

  const handleDelete = async (userId: string) => {
    const result = await deleteUser(userId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete user');
    }
  };

  const handleToggleAdmin = async () => {
    setIsTogglingAdmin(true);
    try {
      const result = isSuperAdmin
        ? await revokeSuperAdmin(profile.id)
        : await makeSuperAdmin(profile.id);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        toast.success(
          isSuperAdmin
            ? 'Physician made member successfully'
            : 'Member made physician successfully',
        );
      } else {
        toast.error(result.error || 'Failed to toggle role');
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      toast.error('Failed to toggle role');
    } finally {
      setIsTogglingAdmin(false);
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
            disabled={isTogglingAdmin}
            className="text-[#2454FF] hover:text-[#1E3FCC] hover:bg-[#2454FF]/10 font-semibold cursor-pointer disabled:opacity-50"
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
      <DeleteUserButton profile={profile} onDelete={handleDelete} />
    </div>
  );
}

export const columns: ColumnDef<ProfileWithStats>[] = [
  {
    accessorKey: 'name',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Name / Email</span>
    ),
    cell: ({ row }) => <NameEmailCell profile={row.original} />,
    enableSorting: false,
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
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Last login</span>
    ),
    cell: ({ row }) => <LastLoginCell profile={row.original} />,
    enableSorting: true,
  },
  {
    id: 'groups',
    accessorFn: (row) =>
      row.orgMemberships?.map((org) => org.orgName).join(', ') || '',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Groups</span>
    ),
    cell: ({ row }) => <GroupsCell profile={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'status',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Registration</span>
    ),
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
      <span className="text-sm font-bold text-[#1E3A5F]">Actions</span>
    ),
    cell: ({ row }) => <ActionsCell profile={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
];
