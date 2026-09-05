'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/medvanta';
import {
  HtmlAvatar,
  HtmlCheckbox,
  HtmlCompletion,
  HtmlGate,
  HtmlRowMenu,
  HtmlSortHeader,
  HtmlStatusBadge,
} from '../../html-helpers';
import { Icon } from '@/components/medvanta';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { AssignProgramModal } from '@/app/(authenticated)/users/[id]/partials/assign-program-modal';
import { AssignGroupModal } from '@/app/(authenticated)/users/[id]/partials/assign-group-modal';
import Link from 'next/link';
import { sendBulkInvitations } from '../../actions';
import { MIN_GATES_FOR_PROGRAM_ASSIGNMENT } from '@/lib/constants/program-assignment-status';
import { getOnboardingPathProgress } from '@/lib/onboarding-path';
import toast from 'react-hot-toast';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import { usePreheat, type PreheatHandlers } from '@/hooks/use-preheat';

function NameEmailCell({ profile }: { profile: ProfileWithStats }) {
  const router = useRouter();
  const { getPreheatHandlers } = usePreheat();
  const userHref = `/users/${profile.id}`;
  const preheatHandlers = getPreheatHandlers(userHref);
  const fullName =
    profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile.first_name || profile.last_name || 'Unknown';

  return (
    <div
      className="cellp cursor-pointer"
      onClick={() => {
        router.push(userHref);
      }}
      {...preheatHandlers}
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

function LastLoginCell({ profile }: { profile: ProfileWithStats }) {
  if (!profile.last_sign_in) {
    return <span className="faint">—</span>;
  }

  let relativeTime: string | null = null;
  try {
    const date = new Date(profile.last_sign_in);
    relativeTime = formatDistanceToNow(date, { addSuffix: true });
  } catch {
    relativeTime = null;
  }

  if (!relativeTime) {
    return <span className="faint">—</span>;
  }

  return (
    <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
      {relativeTime}
    </span>
  );
}

function GroupsCell({ profile }: { profile: ProfileWithStats }) {
  const orgs = profile.orgMemberships || [];
  const router = useRouter();
  const { getPreheatHandlers } = usePreheat();
  const [modalOpen, setModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  if (orgs.length === 0) {
    const handleAssignSuccess = () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['members-filtered'] });
      setModalOpen(false);
    };

    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="faint"
          title="Click to assign group"
        >
          —
        </button>
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

  const handleGroupClick = (orgId: string): void => {
    router.push(`/groups/${orgId}?from=users`);
  };

  const getGroupPreheatHandlers = (
    orgId: string,
  ): PreheatHandlers =>
    getPreheatHandlers(`/groups/${orgId}?from=users`);

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
        className="lnk"
        title={orgNames.join(', ')}
        {...getGroupPreheatHandlers(orgs[0].orgId)}
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
          className="lnk"
          {...getGroupPreheatHandlers(org.orgId)}
        >
          {org.orgName}
          {index < Math.min(orgs.length, 2) - 1 && ', '}
        </button>
      ))}
      {orgs.length > 2 && (
        <span className="faint">, ...</span>
      )}
    </div>
  );
}

function ProgramCell({ profile }: { profile: ProfileWithStats }) {
  const { getPreheatHandlers } = usePreheat();
  const [modalOpen, setModalOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const hasProgram =
    profile.program_assignment_id && profile.program_assignment_name;
  const hasOrganization = (profile.orgMemberships?.length ?? 0) > 0;
  const canAssignProgram =
    (profile.max_gate_unlocked ?? 0) >= MIN_GATES_FOR_PROGRAM_ASSIGNMENT;

  const handleAssignSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['members-filtered'] });
    setModalOpen(false);
  };

  if (hasProgram) {
    const programHref = `/builder/${profile.program_assignment_id}?from=users`;
    return (
      <Link
        href={programHref}
        className="lnk"
        {...getPreheatHandlers(programHref)}
      >
        {profile.program_assignment_name}
      </Link>
    );
  }

  const gateN = profile.max_gate_unlocked ?? 0;
  if (profile.program_due_date && gateN >= 3) {
    const isOverdue = new Date(profile.program_due_date) < new Date();
    return (
      <span className={`bdg ${isOverdue ? 'bdg-d' : 'bdg-o'}`}>
        <Icon name={isOverdue ? 'CircleAlert' : 'Hourglass'} size={12} />
        {isOverdue ? 'Overdue' : 'Due soon'}
      </span>
    );
  }

  if (!canAssignProgram) {
    return <span className="faint">Not assigned</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => hasOrganization && setModalOpen(true)}
        disabled={!hasOrganization}
        className="faint"
        title={
          hasOrganization
            ? 'Click to assign program'
            : 'Assign a group before assigning a program'
        }
      >
        Not assigned
      </button>
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
    return <span className="faint">—</span>;
  }

  const canResend = status === 'invited' || status === 'pending';
  if (!canResend) {
    return <HtmlStatusBadge status={status} />;
  }

  const handleSendInvitation = async (): Promise<void> => {
    if (!profile.email) {
      toast.error('This member has no email address');
      return;
    }
    if (sending) return;
    
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
        void queryClient.invalidateQueries({ queryKey: ['users'] });
        void queryClient.invalidateQueries({ queryKey: ['members-filtered'] });
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
          <HtmlStatusBadge status={status} />
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

function ActionsCell({
  profile,
}: {
  profile: ProfileWithStats;
}): React.ReactElement {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [groupOpen, setGroupOpen] = React.useState(false);
  const hasOrganization = (profile.orgMemberships?.length ?? 0) > 0;

  return (
    <>
      <HtmlRowMenu
        items={[
          {
            id: 'view',
            label: 'View profile',
            onSelect: () => {
              router.push(`/users/${profile.id}`);
            },
          },
          {
            id: 'message',
            label: 'Message',
            onSelect: () => {
              router.push(`/messages?userId=${encodeURIComponent(profile.id)}`);
            },
          },
          {
            id: 'assign',
            label: 'Assign program',
            onSelect: () => {
              if (!hasOrganization) {
                toast.error('Assign a group before assigning a program');
                return;
              }
              setAssignOpen(true);
            },
          },
          {
            id: 'group',
            label: 'Add to group',
            onSelect: () => setGroupOpen(true),
          },
          {
            id: 'admin',
            label: 'Make admin',
            onSelect: () => toastUnavailable('Make admin'),
          },
          {
            id: 'remove',
            label: 'Remove',
            danger: true,
            onSelect: () => toastUnavailable('Remove member'),
          },
        ]}
      />
      {hasOrganization ? (
        <AssignProgramModal
          open={assignOpen}
          onOpenChange={setAssignOpen}
          userId={profile.id}
          userFirstName={profile.first_name}
          userLastName={profile.last_name}
        />
      ) : null}
      <AssignGroupModal
        open={groupOpen}
        onOpenChange={setGroupOpen}
        userId={profile.id}
      />
    </>
  );
}

export const columns: ColumnDef<ProfileWithStats>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <HtmlCheckbox
        checked={table.getIsAllPageRowsSelected()}
        onChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        ariaLabel="Select all"
      />
    ),
    cell: ({ row }) => (
      <HtmlCheckbox
        checked={row.getIsSelected()}
        onChange={(checked) => row.toggleSelected(checked)}
        ariaLabel="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <HtmlSortHeader
        label="Member"
        sorted={column.getIsSorted()}
        onToggle={() =>
          column.toggleSorting(column.getIsSorted() === 'asc')
        }
      />
    ),
    cell: ({ row }) => <NameEmailCell profile={row.original} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const profileA = rowA.original;
      const profileB = rowB.original;
      const nameA =
        profileA.first_name && profileA.last_name
          ? `${profileA.first_name} ${profileA.last_name}`.toLowerCase()
          : profileA.email?.toLowerCase() || '';
      const nameB =
        profileB.first_name && profileB.last_name
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
    id: 'groups',
    accessorFn: (row) =>
      row.orgMemberships?.map((org) => org.orgName).join(', ') || '',
    header: 'Group',
    cell: ({ row }) => <GroupsCell profile={row.original} />,
    enableSorting: true,
    enableColumnFilter: false,
  },
  {
    id: 'program',
    accessorFn: (row) => row.program_assignment_name || '',
    header: 'Program',
    cell: ({ row }) => <ProgramCell profile={row.original} />,
    enableSorting: true,
    enableColumnFilter: false,
  },
  {
    id: 'onboarding',
    accessorFn: (row) => getOnboardingPathProgress(row).cleared,
    header: ({ column }) => (
      <HtmlSortHeader
        label="Onboarding"
        sorted={column.getIsSorted()}
        onToggle={() =>
          column.toggleSorting(column.getIsSorted() === 'asc')
        }
      />
    ),
    cell: ({ row }) => {
      const path = getOnboardingPathProgress(row.original);
      return <HtmlGate unlocked={path.cleared} total={path.total} />;
    },
    enableSorting: true,
  },
  {
    id: 'completion',
    accessorFn: (row) => row.program_completion_percentage ?? 0,
    header: ({ column }) => (
      <HtmlSortHeader
        label="Completion"
        sorted={column.getIsSorted()}
        onToggle={() =>
          column.toggleSorting(column.getIsSorted() === 'asc')
        }
      />
    ),
    cell: ({ row }) => (
      <HtmlCompletion value={row.original.program_completion_percentage} />
    ),
    enableSorting: true,
  },
  {
    accessorKey: 'last_sign_in',
    header: ({ column }) => (
      <HtmlSortHeader
        label="Last active"
        sorted={column.getIsSorted()}
        onToggle={() =>
          column.toggleSorting(column.getIsSorted() === 'asc')
        }
      />
    ),
    cell: ({ row }) => <LastLoginCell profile={row.original} />,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.original.last_sign_in;
      const dateB = rowB.original.last_sign_in;
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
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
    header: () => null,
    cell: ({ row }) => <ActionsCell profile={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
];
