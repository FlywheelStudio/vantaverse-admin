'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import type { UseMutationResult } from '@tanstack/react-query';
import { Avatar, Button, Dialog, Tag } from '@/components/medvanta';

export type GroupMemberRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  program_name: string | null;
  role: 'unassigned' | 'physician' | null;
};

function memberDisplayName(member: GroupMemberRow): string {
  if (member.first_name && member.last_name) {
    return `${member.first_name} ${member.last_name}`;
  }
  return member.first_name || member.last_name || 'Unknown';
}

function NameEmailCell({
  member,
  organizationId,
}: {
  member: GroupMemberRow;
  organizationId: string;
}) {
  const router = useRouter();
  const fullName = memberDisplayName(member);

  const handleClick = (): void => {
    const fromParam = encodeURIComponent(`/groups/${organizationId}`);
    router.push(`/users/${member.user_id}?from=${fromParam}`);
  };

  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 text-left"
      onClick={handleClick}
    >
      <Avatar
        name={fullName}
        src={member.avatar_url || undefined}
        size="md"
      />
      <div className="min-w-0 max-w-60 flex-1">
        <div className="truncate text-[length:var(--text-md)] font-[var(--fw-medium)] text-[var(--text-strong)]">
          {fullName}
        </div>
        {member.email ? (
          <div className="truncate text-[length:var(--text-sm)] text-[var(--text-muted)]">
            {member.email}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function ProgramCell({ member }: { member: GroupMemberRow }) {
  if (!member.program_name) {
    return <span className="text-[var(--text-muted)]">—</span>;
  }
  return <Tag tone="accent">{member.program_name}</Tag>;
}

function RoleCell({ member }: { member: GroupMemberRow }) {
  if (!member.role) {
    return <span className="text-[var(--text-muted)]">—</span>;
  }
  return <Tag>{member.role}</Tag>;
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

  const handleRemove = (): void => {
    removeMemberMutation.mutate(member.user_id, {
      onSuccess: () => {
        setOpen(false);
      },
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" className="text-[var(--danger)]" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <Dialog
        open={open}
        title="Remove member"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isRemoving}>
              Cancel
            </Button>
            <Button variant="danger" loading={isRemoving} onClick={handleRemove}>
              Remove
            </Button>
          </>
        }
      >
        {confirmText}
      </Dialog>
    </>
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
          variant="secondary"
          size="sm"
          disabled={isPending}
          loading={isPending}
          onClick={() => addAdminMutation.mutate(member.user_id)}
        >
          Make admin
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
    header: () => <span>Name / Email</span>,
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
    header: () => <span>Actions</span>,
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
        header: () => <span>Role</span>,
        cell: ({ row }) => <RoleCell member={row.original} />,
        enableSorting: false,
        enableColumnFilter: false,
      },
      actionsCol,
    ];
  }

  return [
    nameCol,
    {
      id: 'program',
      accessorFn: (row) => row.program_name || '',
      header: () => <span>Program</span>,
      cell: ({ row }) => <ProgramCell member={row.original} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    actionsCol,
  ];
}
