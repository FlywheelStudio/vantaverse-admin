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
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useOrganizationsTable } from '@/context/organizations';
import {
  Button,
  Dialog,
  Input,
  Pagination,
  Textarea,
  IconButton,
} from '@/components/medvanta';
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

  const handleDelete = async (): Promise<void> => {
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
    <>
      <IconButton
        icon="Trash2"
        label={`Delete ${organization.name}`}
        variant="ghost"
        size="sm"
        className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
        onClick={() => setOpen(true)}
      />
      <Dialog
        open={open}
        title="Delete Organization"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        Are you sure you want to delete &ldquo;{organization.name}&rdquo;? This action cannot be
        undone.
      </Dialog>
    </>
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

  useEffect(() => {
    if (expandedOrganizationId) {
      handleExpandToggle(expandedOrganizationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().pagination.pageIndex]);

  useEffect(() => {
    if (expandedOrganizationId) {
      handleExpandToggle(expandedOrganizationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  useEffect(() => {
    if (expandedOrganizationId) {
      handleExpandToggle(expandedOrganizationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

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
          iconLeft={isMobile ? 'Plus' : undefined}
          className="shrink-0"
        >
          {isMobile ? null : 'Create New'}
        </Button>
        <Input
          placeholder="Search groups..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          iconLeft="Search"
          className="flex-1"
        />
      </div>
      <div
        ref={tableContainerRef}
        className="relative max-h-[calc(100dvh-20rem)] overflow-auto rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)]"
      >
        <table className="w-full text-[length:var(--text-md)]">
          <thead className="sticky top-0 z-10 bg-[var(--surface-card)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[var(--border-subtle)]">
                {headerGroup.headers.map((header) => {
                  const isDescription = header.column.id === 'description';
                  const isCreated = header.column.id === 'created_at';
                  return (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)] ${
                        isDescription ? 'hidden lg:table-cell' : ''
                      } ${isCreated ? 'hidden md:table-cell' : ''}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
                <th className="px-4 py-3 text-left text-[length:var(--text-xs)] font-[var(--fw-bold)] uppercase tracking-[var(--tracking-wide)] text-[var(--text-muted)]">
                  Actions
                </th>
              </tr>
            ))}
          </thead>
          <tbody>
            {creatingRow && (
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--slate-50)]">
                <td className="px-4 py-4">
                  <CreateRowImageCell />
                </td>
                <td className="px-4 py-4">
                  <Input
                    value={newOrgData.name}
                    onChange={(e) =>
                      setNewOrgData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Organization name"
                  />
                </td>
                <td className="hidden px-4 py-4 lg:table-cell">
                  <Textarea
                    value={newOrgData.description}
                    onChange={(e) =>
                      setNewOrgData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                    rows={2}
                  />
                </td>
                <td className="px-4 py-4">
                  <span className="font-[var(--fw-medium)] text-[var(--text-muted)]">—</span>
                </td>
                <td className="hidden px-4 py-4 md:table-cell">
                  <span className="text-[var(--text-muted)]">—</span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-2">
                    <IconButton
                      icon="Save"
                      label="Save organization"
                      variant="primary"
                      size="sm"
                      shape="rounded"
                      onClick={handleSaveNewOrg}
                      disabled={!newOrgData.name.trim() || !!uploadingImage || savingOrg}
                    />
                    <IconButton
                      icon="X"
                      label="Cancel"
                      variant="secondary"
                      size="sm"
                      shape="rounded"
                      onClick={handleCancelNewOrg}
                      disabled={!!uploadingImage || savingOrg}
                    />
                  </div>
                </td>
              </tr>
            )}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index, array) => {
                const org = row.original;
                const isExpanded = expandedOrganizationId === org.id;
                const teams = org.teams || [];
                const columnCount = columns.length + 1;

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={`border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--slate-50)] ${
                        index === array.length - 1 && !isExpanded ? 'border-b-0' : ''
                      } ${rowZIndex === org.id ? 'highlighted-row' : ''}`}
                      style={
                        rowZIndex === org.id
                          ? {
                              position: 'relative',
                              zIndex: 9999,
                              backgroundColor: 'var(--surface-card)',
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
                            className={`px-4 py-4 ${
                              isDescription ? 'hidden lg:table-cell' : ''
                            } ${isCreated ? 'hidden md:table-cell' : ''}`}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4">
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
                <td colSpan={columns.length + 1} className="h-24 px-4 py-5 text-center">
                  <span className="text-[var(--text-muted)]">No results.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
          {table.getFilteredRowModel().rows.length} organization(s) total.
        </span>
        <Pagination
          page={table.getState().pagination.pageIndex + 1}
          pageCount={Math.max(table.getPageCount(), 1)}
          onChange={(nextPage) => table.setPageIndex(nextPage - 1)}
        />
      </div>
    </div>
  );
}
