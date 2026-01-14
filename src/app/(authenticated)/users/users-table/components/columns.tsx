'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, Shield, ShieldOff, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
      <div className="flex-1 min-w-0">
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

function BadgesCell({ profile }: { profile: ProfileWithStats }) {
  return (
    <div className="flex items-center gap-2">
      {profile.consultation_completed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Consultation Completed</TooltipContent>
        </Tooltip>
      )}
      {profile.screening_completed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
          </TooltipTrigger>
          <TooltipContent>Screening Completed</TooltipContent>
        </Tooltip>
      )}
      {!profile.consultation_completed && !profile.screening_completed && (
        <span className="text-[#64748B] text-xs">—</span>
      )}
    </div>
  );
}

function ProgressCell({ profile }: { profile: ProfileWithStats }) {
  const percentage = profile.program_completion_percentage ?? 0;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <Progress value={percentage} className="flex-1" />
      <span className="text-xs text-[#64748B] font-medium min-w-[40px] text-right">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

function JourneyPhaseCell({ profile }: { profile: ProfileWithStats }) {
  const phase = profile.journey_phase;
  if (!phase) {
    return <span className="text-[#64748B] text-sm">—</span>;
  }
  return <span className="text-sm text-[#1E3A5F] capitalize">{phase}</span>;
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
            ? 'Super admin revoked successfully'
            : 'User made super admin successfully',
        );
      } else {
        toast.error(result.error || 'Failed to toggle admin status');
      }
    } catch (error) {
      console.error('Error toggling admin:', error);
      toast.error('Failed to toggle admin status');
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
          {isSuperAdmin ? 'Revoke Super Admin' : 'Make Super Admin'}
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
    accessorKey: 'badges',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Badges</span>
    ),
    cell: ({ row }) => <BadgesCell profile={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'program_completion_percentage',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Progress</span>
    ),
    cell: ({ row }) => <ProgressCell profile={row.original} />,
    enableSorting: true,
  },
  {
    accessorKey: 'journey_phase',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Journey Phase</span>
    ),
    cell: ({ row }) => <JourneyPhaseCell profile={row.original} />,
    enableSorting: true,
    filterFn: (row, id, value) => {
      const phase = row.getValue(id) as string | null;
      if (!value || value === 'all') return true;
      return phase === value;
    },
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
