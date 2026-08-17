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
import { Icon, Textarea } from '@/components/medvanta';

function EditableNameCell({ org }: { org: Organization }) {
  const value = org.name;
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span
        onClick={() => router.push(`/groups/${org.id}`)}
        className="cursor-pointer font-[var(--fw-semibold)] text-[var(--text-strong)] transition-colors hover:text-[var(--primary)]"
      >
        {value}
      </span>
    </div>
  );
}

function EditableDescriptionCell({ org }: { org: Organization }) {
  const {
    editingCell,
    editingValue,
    setEditingValue,
    handleCellEdit,
    handleCellBlur,
  } = useOrganizationsTable();
  const isEditing =
    editingCell?.id === org.id && editingCell?.field === 'description';
  const description = org.description;

  if (isEditing) {
    return (
      <Textarea
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={() =>
          handleCellBlur(org.id, 'description', editingValue, description)
        }
        rows={2}
        className="text-[length:var(--text-sm)]"
      />
    );
  }

  return (
    <span
      onClick={() => handleCellEdit(org.id, 'description')}
      className="cursor-pointer text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
    >
      {description || '—'}
    </span>
  );
}

function PictureCell({ org }: { org: Organization }) {
  const { handleImageUpload, uploadingImage } = useOrganizationsTable();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isUploading = uploadingImage === org.id;
  const pictureUrl = org.picture_url;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    await handleImageUpload(file, org.id);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  if (!pictureUrl) {
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
          onClick={handleClick}
          disabled={isUploading}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--slate-50)] transition-colors hover:border-[var(--border-focus)] hover:bg-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="Upload" size={20} className="text-[var(--text-muted)]" />
        </button>
      </>
    );
  }

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
        onClick={handleClick}
        disabled={isUploading}
        className="relative flex h-12 w-12 shrink-0 overflow-hidden rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--slate-50)] transition-colors hover:border-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Image
          src={pictureUrl}
          alt=""
          className="aspect-square size-full object-contain"
          width={48}
          height={48}
          key={pictureUrl}
        />
        {isUploading ? (
          <div className="pointer-events-none absolute -inset-1 flex items-center justify-center">
            <div className="loader" style={{ width: '56px', height: '56px' }} />
          </div>
        ) : null}
      </button>
    </>
  );
}

function MembersCell({ org }: { org: Organization }) {
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
    <AvatarGroup
      avatars={avatars}
      maxVisible={5}
      onAddClick={() => handleOpenAddMembers('organization', org.id)}
    />
  );
}

function PhysiologistCell({ org }: { org: Organization }) {
  const physiologists = (org.members || []).filter((m) => m.role === 'admin');
  const avatars = physiologists.map((member) => {
    const profile = member.profile;
    return {
      src: profile?.avatar_url || undefined,
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      userId: profile?.id || '',
    };
  });
  return <AvatarGroup avatars={avatars} maxVisible={1} />;
}

const isTeamsEnabled = process.env.NEXT_PUBLIC_FL_TEAMS !== 'true';

function SortHeader({
  label,
  sorted,
  onToggle,
}: {
  label: string;
  sorted: false | 'asc' | 'desc';
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-[var(--text-strong)]"
    >
      {label}
      <Icon
        name={sorted === 'desc' ? 'ChevronDown' : 'ChevronUp'}
        size={14}
        className={sorted ? 'text-[var(--text-strong)]' : 'text-[var(--text-faint)]'}
      />
    </button>
  );
}

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'picture_url',
    header: () => <span>Image</span>,
    cell: ({ row }) => <PictureCell org={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <SortHeader
          label="Name"
          sorted={sorted}
          onToggle={() => column.toggleSorting(sorted === 'asc')}
        />
      );
    },
    cell: ({ row }) => <EditableNameCell org={row.original} />,
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string;
      return name?.toLowerCase().includes(String(value).toLowerCase());
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <SortHeader
          label="Description"
          sorted={sorted}
          onToggle={() => column.toggleSorting(sorted === 'asc')}
        />
      );
    },
    cell: ({ row }) => <EditableDescriptionCell org={row.original} />,
  },
  {
    accessorKey: 'members_count',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <SortHeader
          label="Members"
          sorted={sorted}
          onToggle={() => column.toggleSorting(sorted === 'asc')}
        />
      );
    },
    cell: ({ row }) => <MembersCell org={row.original} />,
  },
  {
    accessorKey: 'physiologist',
    header: () => <span>Physiologist</span>,
    cell: ({ row }) => <PhysiologistCell org={row.original} />,
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
      if (!date) return <span className="text-[var(--text-muted)]">—</span>;
      return (
        <span className="text-[var(--text-muted)]">
          {new Date(date).toLocaleDateString()}
        </span>
      );
    },
  },
];
