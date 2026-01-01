'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useOrganizationsTable } from './context';

interface OrganizationsTableProps {
  columns: ColumnDef<Organization>[];
  data: Organization[];
}

export function OrganizationsTable({ columns, data }: OrganizationsTableProps) {
  const {
    handleCreate,
    onEdit,
    creatingId,
    editingName,
    setEditingName,
    inputRef,
    handleSave,
    handleCancel,
  } = useOrganizationsTable();
  const isMobile = useIsMobile();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [searchValue, setSearchValue] = React.useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.key === 'Enter') {
      handleSave(id, editingName);
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  React.useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'name');
      if (existing && existing.value === debouncedSearch) {
        return prev;
      }
      const filtered = prev.filter((f) => f.id !== 'name');
      return debouncedSearch
        ? [...filtered, { id: 'name', value: debouncedSearch }]
        : filtered;
    });
  }, [debouncedSearch]);

  // React Compiler: useReactTable returns non-memoizable functions, which is expected
  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row gap-4 mb-6">
        <Button
          onClick={handleCreate}
          className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold px-6 rounded-xl shadow-lg"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Input
          placeholder="Search organizations..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="bg-white border-[#2454FF]/20 rounded-xl placeholder:text-[#64748B]/60 focus:border-[#2454FF] focus:ring-[#2454FF] flex-1"
        />
      </div>
      {(creatingId?.startsWith('temp-') || creatingId) && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-md bg-white/10">
          <Input
            ref={inputRef}
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, creatingId!)}
            onBlur={() => {
              if (editingName.trim()) {
                handleSave(creatingId!, editingName);
              } else {
                handleCancel();
              }
            }}
            placeholder="Organization name"
            className="flex-1"
            autoFocus
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b-2 border-[#2454FF]/20"
              >
                {headerGroup.headers.map((header) => {
                  const isDescription = header.column.id === 'description';
                  const isCreated = header.column.id === 'created_at';
                  return (
                    <th
                      key={header.id}
                      className={`text-left py-4 px-4 text-sm font-bold text-[#1E3A5F] ${
                        isDescription ? 'hidden lg:table-cell' : ''
                      } ${isCreated ? 'hidden md:table-cell' : ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  );
                })}
                <th className="text-left py-4 px-4 text-sm font-bold text-[#1E3A5F]">
                  Actions
                </th>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, array) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#E5E9F0] hover:bg-[#F5F7FA]/50 transition-colors ${
                    index === array.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isDescription = cell.column.id === 'description';
                    const isCreated = cell.column.id === 'created_at';
                    return (
                      <td
                        key={cell.id}
                        className={`py-5 px-4 ${
                          isDescription ? 'hidden lg:table-cell' : ''
                        } ${isCreated ? 'hidden md:table-cell' : ''}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    );
                  })}
                  <td className="py-5 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(row.original)}
                      className="text-[#2454FF] hover:text-[#1E3FCC] hover:bg-[#2454FF]/10 font-semibold"
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="h-24 text-center py-5 px-4"
                >
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-[#E5E9F0]">
        <div className="flex justify-center">
          <span className="text-sm text-[#64748B]">
            {table.getFilteredRowModel().rows.length} organization(s) total.
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-[#64748B] border-[#E5E9F0] rounded-lg"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="px-4 py-2 bg-[#2454FF]/10 text-[#2454FF] rounded-lg font-medium text-sm">
            {isMobile
              ? `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
              : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-[#64748B] border-[#E5E9F0] rounded-lg"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
