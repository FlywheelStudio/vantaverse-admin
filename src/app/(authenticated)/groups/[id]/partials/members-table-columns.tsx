'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import type { UseMutationResult } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

export type GroupMemberRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  program_name: string | null;
  role: 'unassigned' | 'physician' | null;
};

function NameEmailCell({
  member,
  organizationId,
}: {
  member: GroupMemberRow;
  organizationId: string;
}) {
  const router = useRouter();
  const fullName =
    member.first_name && member.last_name
      ? `${member.first_name} ${member.last_name}`
      : member.first_name || member.last_name || null;

  const handleClick = () => {
    const fromParam = encodeURIComponent(`/groups/${organizationId}`);
    router.push(`/users/${member.user_id}?from=${fromParam}`);
  };

  return (
    <div
      className="flex items-center gap-3 cursor-pointer"
      onClick={handleClick}
    >
      <div className="size-10 shrink-0 flex items-center justify-center">
        <Avatar
          src={member.avatar_url}
          firstName={member.first_name || ''}
          lastName={member.last_name || ''}
          userId={member.user_id || 'unknown'}
          size={40}
        />
      </div>
      <div className="flex-1 min-w-0 max-w-60">
        <div className="font-medium text-sm text-[#1E3A5F] truncate">
          {fullName || 'Unknown'}
        </div>
        {member.email && (
          <div className="text-xs text-[#64748B] truncate">{member.email}</div>
        )}
      </div>
    </div>
  );
}

function ProgramCell({ member }: { member: GroupMemberRow }) {
  return (
    <span className="text-sm text-[#1E3A5F]">{member.program_name || '-'}</span>
  );
}

function RoleCell({ member }: { member: GroupMemberRow }) {
  return (
    <span className="text-sm text-[#1E3A5F]">{member.role || '-'}</span>
  );
}

function RemoveButton({
  member,
  removeMemberMutation,
  confirmText,
}: {
  member: GroupMemberRow;
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  confirmText: string;
}) {
  const [open, setOpen] = React.useState(false);
  const isRemoving = removeMemberMutation.isPending;

  const handleRemove = () => {
    removeMemberMutation.mutate(member.user_id, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold cursor-pointer"
        >
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member</AlertDialogTitle>
          <AlertDialogDescription>
            {confirmText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer" disabled={isRemoving}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="cursor-pointer"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActionsCell({
  member,
  removeMemberMutation,
  addAdminMutation,
  isSuperAdminOrg,
}: {
  member: GroupMemberRow;
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  addAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  isSuperAdminOrg?: boolean;
}) {
  if (isSuperAdminOrg && member.role === 'unassigned' && addAdminMutation) {
    const isPending = addAdminMutation.isPending;
    return (
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          disabled={isPending}
          onClick={() => addAdminMutation.mutate(member.user_id)}
        >
          {isPending ? 'Assigning...' : 'Make admin'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end">
      <RemoveButton
        member={member}
        removeMemberMutation={removeMemberMutation}
        confirmText={
          isSuperAdminOrg
            ? 'Remove this admin from the organization? They will no longer be an administrator.'
            : 'Remove this user from the group? They will lose access to this program.'
        }
      />
    </div>
  );
}

export function getMembersColumns({
  removeMemberMutation,
  organizationId,
  isSuperAdminOrg,
  addAdminMutation,
}: {
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  organizationId: string;
  isSuperAdminOrg?: boolean;
  addAdminMutation?: UseMutationResult<string, Error, string, unknown>;
}): ColumnDef<GroupMemberRow>[] {
  const nameCol: ColumnDef<GroupMemberRow> = {
    accessorKey: 'name',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Name / Email</span>
    ),
    cell: ({ row }) => (
      <NameEmailCell member={row.original} organizationId={organizationId} />
    ),
    enableSorting: false,
    filterFn: (row, _id, value) => {
      const member = row.original;
      const searchTerm = String(value).toLowerCase();
      const fullName =
        member.first_name && member.last_name
          ? `${member.first_name} ${member.last_name}`
          : '';
      const email = member.email || '';
      return (
        fullName.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm)
      );
    },
  };

  const actionsCol: ColumnDef<GroupMemberRow> = {
    id: 'actions',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Actions</span>
    ),
    cell: ({ row }) => (
      <ActionsCell
        member={row.original}
        removeMemberMutation={removeMemberMutation}
        addAdminMutation={addAdminMutation}
        isSuperAdminOrg={isSuperAdminOrg}
      />
    ),
    enableSorting: false,
    enableColumnFilter: false,
  };

  if (isSuperAdminOrg) {
    return [
      nameCol,
      {
        id: 'role',
        accessorFn: (row) => row.role || '',
        header: () => (
          <span className="text-sm font-bold text-[#1E3A5F]">Role</span>
        ),
        cell: ({ row }) => <RoleCell member={row.original} />,
        enableSorting: false,
        enableColumnFilter: false,
      },
      actionsCol,
    ];
  }

  return [
    {
      ...nameCol,
    },
    {
      id: 'program',
      accessorFn: (row) => row.program_name || '',
      header: () => (
        <span className="text-sm font-bold text-[#1E3A5F]">Program</span>
      ),
      cell: ({ row }) => <ProgramCell member={row.original} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      ...actionsCol,
    },
  ];
}
