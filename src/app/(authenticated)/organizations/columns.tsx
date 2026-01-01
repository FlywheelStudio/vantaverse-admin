'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: 'picture_url',
    header: 'Image',
    cell: ({ row }) => {
      const pictureUrl = row.getValue('picture_url') as string | null;
      if (!pictureUrl) {
        return (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">—</span>
          </div>
        );
      }
      return (
        <Image
          src={pictureUrl}
          alt=""
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
    filterFn: (row, id, value) => {
      const name = row.getValue(id) as string;
      return name?.toLowerCase().includes(String(value).toLowerCase());
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null;
      if (!description) return <div className="text-muted-foreground">—</div>;
      return <div className="text-sm max-w-md truncate">{description}</div>;
    },
  },
  {
    accessorKey: 'members_count',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Members
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const count = (row.getValue('members_count') as number | undefined) ?? 0;
      return <div className="text-sm font-medium">{count}</div>;
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 lg:px-3"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string | null;
      if (!date) return <div className="text-muted-foreground">—</div>;
      return (
        <div className="text-sm">{new Date(date).toLocaleDateString()}</div>
      );
    },
  },
];
