'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
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
          userId={member.user_id}
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

function RemoveButton({
  member,
  onRemove,
}: {
  member: GroupMemberRow;
  onRemove: (userId: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [isRemoving, setIsRemoving] = React.useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(member.user_id);
      setOpen(false);
    } finally {
      setIsRemoving(false);
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
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove member</AlertDialogTitle>
          <AlertDialogDescription>
            Remove this user from the group? They will lose access to this
            program.
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
  onRemove,
}: {
  member: GroupMemberRow;
  onRemove: (userId: string) => Promise<void>;
}) {
  return (
    <div className="flex items-center justify-end">
      <RemoveButton member={member} onRemove={onRemove} />
    </div>
  );
}

export function getMembersColumns({
  onRemove,
  organizationId,
}: {
  onRemove: (userId: string) => Promise<void>;
  organizationId: string;
}): ColumnDef<GroupMemberRow>[] {
  return [
    {
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
      id: 'actions',
      header: () => (
        <span className="text-sm font-bold text-[#1E3A5F]">Actions</span>
      ),
      cell: ({ row }) => (
        <ActionsCell member={row.original} onRemove={onRemove} />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
  ];
}
