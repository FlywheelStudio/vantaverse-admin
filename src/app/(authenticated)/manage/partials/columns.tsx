'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  HtmlAvatar,
  HtmlRowMenu,
  HtmlSortHeader,
  HtmlStatusBadge,
} from '../../users/html-helpers';
import { removeAdminUser, sendBulkInvitations } from '../../users/actions';
import type { AdminProfile } from '@/lib/supabase/schemas/admins';
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

function fullNameOf(profile: AdminProfile): string {
  const parts = [profile.first_name, profile.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}

function NameEmailCell({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const fullName = fullNameOf(profile);

  return (
    <div
      className="cellp cursor-pointer"
      onClick={() => router.push(`/manage/${profile.id}`)}
    >
      <HtmlAvatar name={fullName} src={profile.avatar_url} size={36} />
      <span style={{ minWidth: 0 }}>
        <span className="nm" style={{ display: 'block' }}>
          {fullName}
        </span>
        {profile.email ? <span className="em">{profile.email}</span> : null}
      </span>
    </div>
  );
}

function GroupsCell({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const orgs = profile.orgMemberships ?? [];

  if (orgs.length === 0) {
    // Super admins carry no per-group membership, so this is the normal state
    // for a platform-wide admin rather than missing data.
    return <span className="faint">All groups</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {orgs.slice(0, 2).map((org, index) => (
        <button
          key={org.orgId}
          type="button"
          className="lnk"
          onClick={() => router.push(`/groups/${org.orgId}?from=manage`)}
        >
          {org.orgName}
          {index < Math.min(orgs.length, 2) - 1 && ', '}
        </button>
      ))}
      {orgs.length > 2 ? (
        <span className="faint" title={orgs.map((o) => o.orgName).join(', ')}>
          +{orgs.length - 2} more
        </span>
      ) : null}
    </div>
  );
}

function AccessCell({ profile }: { profile: AdminProfile }) {
  if (profile.is_super_admin) {
    return <span className="bdg bdg-b">Super admin</span>;
  }
  return <span className="bdg">Admin</span>;
}

/** Relative time, or null when the stored timestamp is absent or unparseable. */
function relativeLastActive(lastSignIn: string | null | undefined): string | null {
  if (!lastSignIn) return null;
  const date = new Date(lastSignIn);
  if (Number.isNaN(date.getTime())) return null;
  return formatDistanceToNow(date, { addSuffix: true });
}

function LastActiveCell({ profile }: { profile: AdminProfile }) {
  const relative = relativeLastActive(profile.last_sign_in);

  if (!relative) {
    return (
      <span className="faint">{profile.last_sign_in ? '—' : 'Never'}</span>
    );
  }

  return (
    <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
      {relative}
    </span>
  );
}

function ActionsCell({ profile }: { profile: AdminProfile }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [sending, setSending] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const awaitingInvite =
    profile.status === 'pending' || profile.status === 'invited';
  const displayName = fullNameOf(profile);

  const handleResend = async (): Promise<void> => {
    if (!profile.email || sending) return;
    setSending(true);
    try {
      // `true` — this list is admins only, so the invite must use the admin
      // template and grant path.
      const result = await sendBulkInvitations([profile.email], true);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const failed = result.data.results.find((row) => !row.success);
      if (failed) {
        toast.error(failed.error || 'Failed to send invitation');
        return;
      }
      toast.success('Invitation sent');
      queryClient.invalidateQueries({ queryKey: ['admins-filtered'] });
    } catch (error) {
      console.error('Error sending admin invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (): Promise<void> => {
    if (removing) return;
    setRemoving(true);
    try {
      const result = await removeAdminUser(profile.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(`${displayName} removed`);
      setConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admins-filtered'] });
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <HtmlRowMenu
        items={[
          {
            id: 'view',
            label: 'View profile',
            onSelect: () => router.push(`/manage/${profile.id}`),
          },
          {
            id: 'resend',
            label: sending ? 'Sending…' : 'Resend invitation',
            disabled: !awaitingInvite || !profile.email || sending,
            onSelect: handleResend,
          },
          {
            id: 'remove',
            label: 'Remove admin',
            danger: true,
            onSelect: () => setConfirmOpen(true),
          },
        ]}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes {displayName}
              {profile.email ? ` (${profile.email})` : ''}. Their account and
              admin access cannot be recovered. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removing}
              onClick={(event) => {
                event.preventDefault();
                void handleRemove();
              }}
            >
              {removing ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// No select column: this table has no bulk actions, so a checkbox would select
// rows that nothing can act on.
export const adminColumns: ColumnDef<AdminProfile>[] = [
  {
    // `name` is the id the shared table hook filters on for search.
    accessorKey: 'name',
    header: ({ column }) => (
      <HtmlSortHeader
        label="Admin"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => <NameEmailCell profile={row.original} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) =>
      fullNameOf(rowA.original)
        .toLowerCase()
        .localeCompare(fullNameOf(rowB.original).toLowerCase()),
    filterFn: (row, _id, value) => {
      const term = String(value).toLowerCase();
      const profile = row.original;
      return (
        fullNameOf(profile).toLowerCase().includes(term) ||
        (profile.email ?? '').toLowerCase().includes(term)
      );
    },
  },
  {
    id: 'groups',
    accessorFn: (row) =>
      row.orgMemberships?.map((org) => org.orgName).join(', ') || '',
    header: 'Groups',
    cell: ({ row }) => <GroupsCell profile={row.original} />,
    enableSorting: true,
    enableColumnFilter: false,
  },
  {
    id: 'access',
    accessorFn: (row) => (row.is_super_admin ? 1 : 0),
    header: 'Access',
    cell: ({ row }) => <AccessCell profile={row.original} />,
    enableSorting: true,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <HtmlStatusBadge status={row.original.status} />,
    enableSorting: true,
  },
  {
    accessorKey: 'last_sign_in',
    header: ({ column }) => (
      <HtmlSortHeader
        label="Last active"
        sorted={column.getIsSorted()}
        onToggle={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      />
    ),
    cell: ({ row }) => <LastActiveCell profile={row.original} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.last_sign_in;
      const b = rowB.original.last_sign_in;
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    },
  },
  {
    id: 'actions',
    header: () => null,
    cell: ({ row }) => <ActionsCell profile={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
];
