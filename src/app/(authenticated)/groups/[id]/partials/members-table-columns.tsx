'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import type { UseMutationResult } from '@tanstack/react-query';
import { Dialog } from '@/components/medvanta';
import { avatarTone } from '@/app/(authenticated)/dashboard/html-utils';

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

function memberInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function NameEmailCell({
  member,
  organizationId,
}: {
  member: GroupMemberRow;
  organizationId: string;
}): React.ReactElement {
  const router = useRouter();
  const fullName = memberDisplayName(member);

  const handleClick = (): void => {
    const fromParam = encodeURIComponent(`/groups/${organizationId}`);
    router.push(`/users/${member.user_id}?from=${fromParam}`);
  };

  return (
    <button
      type="button"
      className="cellp"
      style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}
      onClick={handleClick}
    >
      <span
        className={`av ${avatarTone(fullName)} av-32`}
        style={{ width: 34, height: 34, fontSize: 12 }}
      >
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={fullName} className="size-full object-cover" />
        ) : (
          memberInitials(fullName)
        )}
      </span>
      <span style={{ minWidth: 0 }}>
        <span className="nm" style={{ display: 'block' }}>
          {fullName}
        </span>
        {member.email ? <span className="em">{member.email}</span> : null}
      </span>
    </button>
  );
}

function ProgramCell({ member }: { member: GroupMemberRow }): React.ReactElement {
  if (!member.program_name) {
    return <span className="faint">Not assigned</span>;
  }
  return <span className="lnk">{member.program_name}</span>;
}

function RoleCell({ member }: { member: GroupMemberRow }): React.ReactElement {
  if (!member.role) {
    return <span className="faint">—</span>;
  }
  return <span className="bdg">{member.role}</span>;
}

function RemoveButton({
  member,
  removeMemberMutation,
  confirmText,
}: {
  member: GroupMemberRow;
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  confirmText: string;
}): React.ReactElement {
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
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ color: 'var(--danger)' }}
        onClick={() => setOpen(true)}
      >
        Remove
      </button>
      <Dialog
        open={open}
        title="Remove member"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-sec"
              onClick={() => setOpen(false)}
              disabled={isRemoving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-dan"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving ? 'Removing…' : 'Remove'}
            </button>
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
}): React.ReactElement {
  if (isSuperAdminOrg && member.role === 'unassigned' && addAdminMutation) {
    const isPending = addAdminMutation.isPending;
    return (
      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          className="btn btn-sec btn-sm"
          disabled={isPending}
          onClick={() => addAdminMutation.mutate(member.user_id)}
        >
          {isPending ? 'Assigning…' : 'Make admin'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'right' }}>
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
    header: () => <span className="srt">Member</span>,
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
    header: () => null,
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
