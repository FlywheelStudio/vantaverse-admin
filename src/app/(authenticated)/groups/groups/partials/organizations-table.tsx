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
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useOrganizationsTable } from '@/context/organizations';
import { Dialog, Icon } from '@/components/medvanta';
import { HtmlSearchField } from '../../partials/html-search-field';
import { HtmlTableFooter } from '../../partials/html-table-footer';
import { CreateRowImageCell } from './create-row-image-cell';
import { TeamsExpandedRow } from '../../teams/partials/teams-expanded-row';

function DeleteOrganizationButton({
  organization,
  onDelete,
}: {
  organization: Organization;
  onDelete: (id: string) => Promise<void>;
}): React.ReactElement {
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
      <button
        type="button"
        className="ib ib-dan ib-sq ib-sm"
        aria-label={`Delete ${organization.name}`}
        onClick={() => setOpen(true)}
      >
        <Icon name="Trash2" size={16} />
      </button>
      <Dialog
        open={open}
        title="Delete Organization"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-sec"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-dan"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
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

export function OrganizationsTable({ columns, data }: OrganizationsTableProps): React.ReactElement {
  const {
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

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'group');
      if (existing && existing.value === debouncedSearch) return prev;
      const filtered = prev.filter((f) => f.id !== 'group');
      return debouncedSearch
        ? [...filtered, { id: 'group', value: debouncedSearch }]
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
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  useEffect(() => {
    if (expandedOrganizationId) handleExpandToggle(expandedOrganizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().pagination.pageIndex]);

  useEffect(() => {
    if (expandedOrganizationId) handleExpandToggle(expandedOrganizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  useEffect(() => {
    if (expandedOrganizationId) handleExpandToggle(expandedOrganizationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  useEffect(() => {
    if (creatingRow && tableContainerRef.current) {
      tableContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [creatingRow]);

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <>
      <div className="tbar">
        <HtmlSearchField
          placeholder="Search groups by name or domain…"
          value={searchValue}
          onChange={setSearchValue}
        />
        <button type="button" className="btn btn-sec" disabled title="Filters not available">
          <Icon name="Funnel" size={16} />
          Filters
        </button>
      </div>

      <div className="tw" ref={tableContainerRef}>
        <table className="tbl">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                <th style={{ width: 52 }} aria-label="Actions" />
              </tr>
            ))}
          </thead>
          <tbody>
            {creatingRow ? (
              <tr>
                <td colSpan={columns.length + 1}>
                  <div className="row" style={{ gap: 12, padding: '8px 0' }}>
                    <CreateRowImageCell />
                    <span className="fld grow">
                      <input
                        placeholder="Organization name"
                        value={newOrgData.name}
                        onChange={(e) =>
                          setNewOrgData((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </span>
                    <textarea
                      className="ta"
                      rows={1}
                      placeholder="Description"
                      value={newOrgData.description}
                      onChange={(e) =>
                        setNewOrgData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      style={{ flex: 1, minWidth: 160 }}
                    />
                    <button
                      type="button"
                      className="ib ib-sec ib-sq"
                      onClick={handleSaveNewOrg}
                      disabled={!newOrgData.name.trim() || !!uploadingImage || savingOrg}
                      aria-label="Save organization"
                    >
                      <Icon name="Save" size={16} />
                    </button>
                    <button
                      type="button"
                      className="ib ib-sec ib-sq"
                      onClick={handleCancelNewOrg}
                      disabled={!!uploadingImage || savingOrg}
                      aria-label="Cancel"
                    >
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ) : null}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const org = row.original;
                const isExpanded = expandedOrganizationId === org.id;
                const teams = org.teams || [];
                const columnCount = columns.length + 1;

                return (
                  <React.Fragment key={row.id}>
                    <tr
                      className={rowZIndex === org.id ? 'sel-row' : undefined}
                      style={
                        rowZIndex === org.id
                          ? { position: 'relative', zIndex: 9999 }
                          : undefined
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                      <td style={{ textAlign: 'right' }}>
                        <DeleteOrganizationButton
                          organization={row.original}
                          onDelete={handleDelete}
                        />
                      </td>
                    </tr>
                    {isExpanded ? (
                      <TeamsExpandedRow
                        organizationId={org.id}
                        teams={teams}
                        columnCount={columnCount}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <HtmlTableFooter
          summary={
            <>
              Showing all{' '}
              <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-body)' }}>
                {filteredCount}
              </b>{' '}
              groups
            </>
          }
          page={table.getState().pagination.pageIndex + 1}
          pageCount={Math.max(table.getPageCount(), 1)}
          onPageChange={(nextPage) => table.setPageIndex(nextPage - 1)}
        />
      </div>
    </>
  );
}
