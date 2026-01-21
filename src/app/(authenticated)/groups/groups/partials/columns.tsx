'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { useOrganizationsTable } from '@/context/organizations';
import { AvatarGroup } from '@/components/ui/avatar-group';
import { TeamsCell } from '../../teams/partials/teams-cell';
import { useRouter } from 'next/navigation';

function EditableNameCell({ org }: { org: Organization }) {
  const value = org.name;
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <span
        onClick={() => router.push(`/groups/${org.id}`)}
        className="font-semibold text-[#1E3A5F] cursor-pointer hover:text-[#2454FF] transition-colors"
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
    handleCancel,
    inputRef,
  } = useOrganizationsTable();
  const isEditing =
    editingCell?.id === org.id && editingCell?.field === 'description';
  const description = org.description;

  if (isEditing) {
    return (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={() =>
          handleCellBlur(org.id, 'description', editingValue, description)
        }
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        className="text-[#64748B] min-h-[60px]"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => handleCellEdit(org.id, 'description')}
      className="text-[#64748B] cursor-pointer hover:text-[#2454FF] transition-colors"
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    // Upload immediately for existing orgs
    await handleImageUpload(file, org.id);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
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
          onClick={handleClick}
          disabled={isUploading}
          className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-12 w-12 border-2 border-[#E5E9F0] bg-muted items-center justify-center hover:border-[#2454FF] hover:bg-[#2454FF]/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-5 w-5 text-[#64748B]" />
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
        onClick={handleClick}
        disabled={isUploading}
        className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-12 w-12 border-2 border-[#E5E9F0] hover:border-[#2454FF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-200"
      >
        <Image
          src={pictureUrl}
          alt=""
          className="aspect-square size-full object-contain"
          width={48}
          height={48}
        />
        {isUploading && (
          <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
            <div className="loader" style={{ width: '56px', height: '56px' }} />
          </div>
        )}
      </button>
    </>
  );
}

function MembersCell({ org }: { org: Organization }) {
  const { handleOpenAddMembers } = useOrganizationsTable();
  const members = org.members || [];
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

const isTeamsEnabled =
  process.env.NEXT_PUBLIC_FL_TEAMS !== 'true';

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'picture_url',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Image</span>
    ),
    cell: ({ row }) => <PictureCell org={row.original} />,
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors cursor-pointer"
        >
          Name
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[#1E3A5F]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]/40" />
          )}
        </button>
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
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors cursor-pointer"
        >
          Description
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[#1E3A5F]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]/40" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <EditableDescriptionCell org={row.original} />,
  },
  {
    accessorKey: 'members_count',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors cursor-pointer"
        >
          Members
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[#1E3A5F]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]/40" />
          )}
        </button>
      );
    },
    cell: ({ row }) => <MembersCell org={row.original} />,
  },
  ...(isTeamsEnabled
    ? [
        {
          accessorKey: 'teams_count',
          header: () => (
            <span className="text-sm font-bold text-[#1E3A5F]">Teams</span>
          ),
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
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors cursor-pointer"
        >
          Created
          {sorted === 'asc' ? (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]" />
          ) : sorted === 'desc' ? (
            <ChevronDown className="h-4 w-4 text-[#1E3A5F]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#1E3A5F]/40" />
          )}
        </button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string | null;
      if (!date) return <span className="text-[#64748B]">—</span>;
      return (
        <span className="text-[#64748B]">
          {new Date(date).toLocaleDateString()}
        </span>
      );
    },
  },
];
