'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
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
import {
  DEFAULT_GROUPS_FILTERS,
  GroupsFilterPanel,
  type GroupsFilterState,
} from './groups-filter-panel';

function physiologistName(org: Organization): string | null {
  const admin = (org.members || []).find((m) => m.role === 'admin')?.profile;
  if (!admin) return null;
  const name = [admin.first_name, admin.last_name].filter(Boolean).join(' ').trim();
  return name || admin.email || null;
}

function orgMembersCount(org: Organization): number {
  return (
    org.members_count ??
    (org.members || []).filter((m) => m.role !== 'admin').length
  );
}

function matchesCreatedFilter(
  createdAt: string | null | undefined,
  filter: GroupsFilterState['created'],
): boolean {
  if (filter === 'any') return true;
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const now = Date.now();
  if (filter === '30d') return now - created <= 30 * 24 * 60 * 60 * 1000;
  if (filter === 'quarter') {
    const d = new Date();
    const quarterStart = new Date(
      d.getFullYear(),
      Math.floor(d.getMonth() / 3) * 3,
      1,
    );
    return created >= quarterStart.getTime();
  }
  if (filter === 'year') {
    return new Date(createdAt).getFullYear() === new Date().getFullYear();
  }
  return true;
}

function DeleteOrganizationButton({
  organization,
  onDelete,
}: {
  organization: Organization;
  onDelete: (id: string) => Promise<void>;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const closeDialog = (): void => {
    setOpen(false);
    setConfirmText('');
  };

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await onDelete(organization.id);
      closeDialog();
    } catch (error) {
      console.error('Error deleting organization:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = confirmText === organization.name;

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
        onClose={closeDialog}
        footer={
          <>
            <button
              type="button"
              className="btn btn-sec"
              onClick={closeDialog}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-dan"
              onClick={handleDelete}
              disabled={isDeleting || !canDelete}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p style={{ marginBottom: 14 }}>
          Are you sure you want to delete &ldquo;{organization.name}&rdquo;? This action cannot be
          undone.
        </p>
        <div className="ff">
          <label className="lbl" htmlFor="delete-org-confirm">
            Type <strong>{organization.name}</strong> to confirm
          </label>
          <div className="fld">
            <input
              id="delete-org-confirm"
              type="text"
              autoComplete="off"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={organization.name}
            />
          </div>
        </div>
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelFilters, setPanelFilters] =
    useState<GroupsFilterState>(DEFAULT_GROUPS_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<GroupsFilterState>(DEFAULT_GROUPS_FILTERS);
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

  const physiologistOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const org of data) {
      const name = physiologistName(org);
      if (!name) continue;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((org) => {
      const count = orgMembersCount(org);
      if (count < appliedFilters.membersMin || count > appliedFilters.membersMax) {
        return false;
      }
      if (appliedFilters.physiologistNames.length > 0) {
        const name = physiologistName(org);
        if (!name || !appliedFilters.physiologistNames.includes(name)) return false;
      }
      if (!matchesCreatedFilter(org.created_at, appliedFilters.created)) return false;
      return true;
    });
  }, [data, appliedFilters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.physiologistNames.length > 0) count += 1;
    if (appliedFilters.membersMin > 0 || appliedFilters.membersMax < 50) count += 1;
    if (appliedFilters.created !== 'any') count += 1;
    return count;
  }, [appliedFilters]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize: 25 } },
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
        <span className="sp" />
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <button
            type="button"
            className={`btn btn-sec${filtersOpen ? ' btn-pri' : ''}`}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Icon name="Funnel" size={16} />
            Filters
            {activeFilterCount > 0 ? (
              <span className="bdg bdg-b">{activeFilterCount}</span>
            ) : null}
          </button>
          <GroupsFilterPanel
            open={filtersOpen}
            onClose={() => {
              setPanelFilters(appliedFilters);
              setFiltersOpen(false);
            }}
            activeCount={activeFilterCount}
            physiologistOptions={physiologistOptions}
            filters={panelFilters}
            onChange={setPanelFilters}
            onClear={() => {
              setPanelFilters(DEFAULT_GROUPS_FILTERS);
              setAppliedFilters(DEFAULT_GROUPS_FILTERS);
            }}
            onApply={() => {
              setAppliedFilters(panelFilters);
              setFiltersOpen(false);
            }}
          />
        </div>
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
                    <tr className={rowZIndex === org.id ? 'sel-row' : undefined}>
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
