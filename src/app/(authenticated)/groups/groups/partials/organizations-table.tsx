'use client';

import React, { useEffect, useState, useRef } from 'react';
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
import { ChevronLeft, ChevronRight, Plus, Save, X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useOrganizationsTable } from '@/context/organizations';
import { CreateRowImageCell } from './create-row-image-cell';
import { TeamsExpandedRow } from '../../teams/partials/teams-expanded-row';

function DeleteOrganizationButton({
  organization,
  onDelete,
}: {
  organization: Organization;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(organization.id);
      setOpen(false);
    } catch (error) {
      console.error('Error deleting organization:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{organization.name}&rdquo;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="cursor-pointer"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface OrganizationsTableProps {
  columns: ColumnDef<Organization>[];
  data: Organization[];
}

export function OrganizationsTable({ columns, data }: OrganizationsTableProps) {
  const {
    handleCreate,
    creatingRow,
    newOrgData,
    setNewOrgData,
    handleSaveNewOrg,
    handleCancelNewOrg,
    handleDelete,
    expandedOrganizationId,
    handleExpandToggle,
    rowZIndex,
    uploadingImage,
    savingOrg,
  } = useOrganizationsTable();

  const isMobile = useIsMobile();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  // Close expanded view when pagination changes
  useEffect(() => {
    if (expandedOrganizationId) {
      handleExpandToggle(expandedOrganizationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().pagination.pageIndex]);

  // Close expanded view when sorting changes
  useEffect(() => {
    if (expandedOrganizationId) {
      handleExpandToggle(expandedOrganizationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  // Close expanded view when filtering changes
  useEffect(() => {
    if (expandedOrganizationId) {
      handleExpandToggle(expandedOrganizationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  // Smooth scroll to top when creating new row
  useEffect(() => {
    if (creatingRow && tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [creatingRow]);

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button
          onClick={handleCreate}
          className="h-11 rounded-[var(--radius-pill)] px-5 shadow-[var(--shadow-md)] cursor-pointer"
        >
          {isMobile ? <Plus className="h-4 w-4" /> : 'Create New'}
        </Button>
        <Input
          placeholder="Search groups..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="h-11 flex-1 rounded-[var(--radius-md)] bg-card"
        />
      </div>
      <div
        ref={tableContainerRef}
        className="relative max-h-[calc(100dvh-20rem)] overflow-auto rounded-[var(--radius-lg)] border border-border/60 bg-card"
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-border"
              >
                {headerGroup.headers.map((header) => {
                  const isDescription = header.column.id === 'description';
                  const isCreated = header.column.id === 'created_at';
                  return (
                    <th
                      key={header.id}
                      className={`text-left py-3 px-4 text-sm font-semibold text-muted-foreground ${
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
                <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            ))}
          </thead>
          <tbody>
            {creatingRow && (
              <tr className="border-b border-border/60 bg-muted/30">
                <td className="py-5 px-4">
                  <CreateRowImageCell />
                </td>
                <td className="py-5 px-4">
                  <Input
                    value={newOrgData.name}
                    onChange={(e) =>
                      setNewOrgData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Organization name"
                    className="h-10 bg-card text-sm font-medium"
                  />
                </td>
                <td className="py-5 px-4 hidden lg:table-cell">
                  <Textarea
                    value={newOrgData.description}
                    onChange={(e) =>
                      setNewOrgData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                    className="min-h-[60px] bg-card text-sm"
                  />
                </td>
                <td className="py-5 px-4">
                  <span className="font-medium text-muted-foreground">—</span>
                </td>
                <td className="py-5 px-4 hidden md:table-cell">
                  <span className="text-muted-foreground">—</span>
                </td>
                <td className="py-5 px-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveNewOrg}
                      disabled={
                        !newOrgData.name.trim() || !!uploadingImage || savingOrg
                      }
                      size="icon-sm"
                      className="h-9 w-9 rounded-[var(--radius-md)] cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleCancelNewOrg}
                      variant="outline"
                      disabled={!!uploadingImage || savingOrg}
                      size="icon-sm"
                      className="h-9 w-9 rounded-[var(--radius-md)] cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, array) => {
                const org = row.original;
                const isExpanded = expandedOrganizationId === org.id;
                const teams = org.teams || [];
                const columnCount = columns.length + 1; // +1 for Actions column

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`border-b border-border/60 hover:bg-muted/40 transition-colors ${
                        index === array.length - 1 && !isExpanded
                          ? 'border-b-0'
                          : ''
                      } ${rowZIndex === org.id ? 'highlighted-row' : ''}`}
                      style={
                        rowZIndex === org.id
                          ? {
                              position: 'relative',
                              zIndex: 9999,
                              backgroundColor: 'var(--card)',
                            }
                          : undefined
                      }
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
                        <DeleteOrganizationButton
                          organization={row.original}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <TeamsExpandedRow
                        organizationId={org.id}
                        teams={teams}
                        columnCount={columnCount}
                      />
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="h-24 text-center py-5 px-4"
                >
                  <span className="text-muted-foreground">No results.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
        <div className="flex justify-center md:justify-start">
          <span className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} organization(s) total.
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-[var(--radius-pill)]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="px-4 py-2 rounded-[var(--radius-md)] border border-border bg-secondary text-secondary-foreground font-medium text-sm">
            {isMobile
              ? `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
              : `Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-[var(--radius-pill)]"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
