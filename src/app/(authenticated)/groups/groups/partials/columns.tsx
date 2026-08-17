'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import toast from 'react-hot-toast';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import Image from 'next/image';
import { useOrganizationsTable } from '@/context/organizations';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { TeamsCell } from '../../teams/partials/teams-cell';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/medvanta';

function groupInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function GroupCell({ org }: { org: Organization }): React.ReactElement {
  const router = useRouter();

  return (
    <div className="cellp">
      <GroupLogo org={org} />
      <span style={{ minWidth: 0 }}>
        <button
          type="button"
          className="nm"
          style={{ display: 'block', cursor: 'pointer', border: 'none', background: 'transparent', padding: 0, textAlign: 'left' }}
          onClick={() => router.push(`/groups/${org.id}`)}
        >
          {org.name}
        </button>
        <span className="em">{org.description || '—'}</span>
      </span>
    </div>
  );
}

function GroupLogo({ org }: { org: Organization }): React.ReactElement {
  const { handleImageUpload, uploadingImage } = useOrganizationsTable();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isUploading = uploadingImage === org.id;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }
    await handleImageUpload(file, org.id);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="thmb gr"
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-sm)',
          flex: '0 0 auto',
          overflow: 'hidden',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {org.picture_url ? (
          <Image
            src={org.picture_url}
            alt=""
            width={38}
            height={38}
            className="size-full object-cover"
          />
        ) : (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: 12,
              fontWeight: 'var(--fw-bold)',
            }}
          >
            {groupInitials(org.name)}
          </span>
        )}
      </button>
    </>
  );
}

function MembersCell({ org }: { org: Organization }): React.ReactElement {
  const { handleOpenAddMembers } = useOrganizationsTable();
  const members = (org.members || []).filter((m) => m.role !== 'admin');
  const avatars = members.map((member) => {
    const profile = member.profile;
    return {
      src: profile?.avatar_url || undefined,
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      userId: profile?.id || '',
    };
  });

  return (
    <div className="row" style={{ gap: 10 }}>
      <AvatarGroup
        avatars={avatars}
        maxVisible={4}
        onAddClick={() => handleOpenAddMembers('organization', org.id)}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-muted)',
        }}
      >
        {members.length}
      </span>
    </div>
  );
}

function PhysiologistCell({ org }: { org: Organization }): React.ReactElement {
  const physiologists = (org.members || []).filter((m) => m.role === 'admin');
  const admin = physiologists[0]?.profile;
  const name = admin
    ? [admin.first_name, admin.last_name].filter(Boolean).join(' ') || 'Admin'
    : null;

  if (!admin) {
    return <span className="faint">Not assigned</span>;
  }

  return (
    <div className="row" style={{ gap: 9 }}>
      <span
        className="av av-t1 av-28"
        style={{ width: 28, height: 28, fontSize: 11 }}
      >
        {admin.avatar_url ? (
          <img src={admin.avatar_url} alt={name || ''} className="size-full object-cover" />
        ) : (
          groupInitials(name || 'A')
        )}
      </span>
      <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-medium)', color: 'var(--text-strong)' }}>
        {name}
      </span>
    </div>
  );
}

function ProgramsCell(): React.ReactElement {
  return <span className="faint">None</span>;
}

function SortHeader({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | 'asc' | 'desc';
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="srt" onClick={onToggle} style={{ border: 'none', background: 'transparent', padding: 0 }}>
      {label}
      <Icon
        name={sorted === 'desc' ? 'ChevronDown' : 'ChevronUp'}
        size={14}
        style={{ marginLeft: 4, verticalAlign: 'middle', opacity: sorted ? 1 : 0.4 }}
      />
    </button>
  );
}

const isTeamsEnabled = process.env.NEXT_PUBLIC_FL_TEAMS !== 'true';

export const columns: ColumnDef<Organization>[] = [
  {
    id: 'group',
    accessorKey: 'name',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <SortHeader
          label="Group"
          sorted={sorted}
          onToggle={() => column.toggleSorting(sorted === 'asc')}
        />
      );
    },
    cell: ({ row }) => <GroupCell org={row.original} />,
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string;
      return name?.toLowerCase().includes(String(value).toLowerCase());
    },
  },
  {
    accessorKey: 'members_count',
    header: () => <span>Members</span>,
    cell: ({ row }) => <MembersCell org={row.original} />,
  },
  {
    id: 'physiologist',
    header: () => <span>Physiologist</span>,
    cell: ({ row }) => <PhysiologistCell org={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    id: 'programs',
    header: () => <span>Programs</span>,
    cell: () => <ProgramsCell />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  ...(isTeamsEnabled
    ? [
        {
          accessorKey: 'teams_count',
          header: () => <span>Teams</span>,
          cell: ({ row }: { row: { original: Organization } }) => (
            <TeamsCell organization={row.original} />
          ),
          enableSorting: false,
          enableColumnFilter: false,
        } as ColumnDef<Organization>,
      ]
    : []),
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <SortHeader
          label="Created"
          sorted={sorted}
          onToggle={() => column.toggleSorting(sorted === 'asc')}
        />
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string | null;
      if (!date) return <span className="faint">—</span>;
      return (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-muted)',
          }}
        >
          {new Date(date).toLocaleDateString()}
        </span>
      );
    },
  },
];
