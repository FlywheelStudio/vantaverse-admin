'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useOrganizationsTable } from './context';

function EditableNameCell({ org }: { org: Organization }) {
  const {
    editingCell,
    editingValue,
    setEditingValue,
    handleCellEdit,
    handleCellBlur,
    handleCancel,
    inputRef,
  } = useOrganizationsTable();
  const isEditing = editingCell?.id === org.id && editingCell?.field === 'name';
  const value = org.name;

  if (isEditing) {
    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={editingValue}
        onChange={(e) => setEditingValue(e.target.value)}
        onBlur={() => handleCellBlur(org.id, 'name', editingValue, value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
          }
        }}
        className="font-semibold text-[#1E3A5F]"
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => handleCellEdit(org.id, 'name')}
      className="font-semibold text-[#1E3A5F] cursor-pointer hover:text-[#2454FF] transition-colors"
    >
      {value}
    </span>
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

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'picture_url',
    header: () => (
      <span className="text-sm font-bold text-[#1E3A5F]">Image</span>
    ),
    cell: ({ row }) => {
      const pictureUrl = row.getValue('picture_url') as string | null;
      if (!pictureUrl) {
        return (
          <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-12 w-12 border-2 border-[#E5E9F0] bg-muted items-center justify-center">
            <span className="text-[#64748B] text-xs">—</span>
          </span>
        );
      }
      return (
        <span className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-12 w-12 border-2 border-[#E5E9F0]">
          <Image
            src={pictureUrl}
            alt=""
            className="aspect-square size-full object-cover"
            width={48}
            height={48}
          />
        </span>
      );
    },
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
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors"
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
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors"
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
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors"
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
    cell: ({ row }) => {
      const count = (row.getValue('members_count') as number | undefined) ?? 0;
      return <span className="font-semibold text-[#1E3A5F]">{count}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      const sorted = column.getIsSorted();
      return (
        <button
          onClick={() => column.toggleSorting(sorted === 'asc')}
          className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F] hover:text-[#2454FF] transition-colors"
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
