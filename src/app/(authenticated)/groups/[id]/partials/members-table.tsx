'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';
import { Icon } from '@/components/medvanta';
import { ActiveFilterPills, useFilterDraft } from '@/components/filters';
import { HtmlSearchField } from '../../partials/html-search-field';
import { HtmlTableFooter } from '../../partials/html-table-footer';
import {
  getMembersColumns,
  type GroupMemberRow,
} from './members-table-columns';
import type { UseMutationResult } from '@tanstack/react-query';

type ProgramFilter = 'all' | 'assigned' | 'not_assigned';

interface GroupMembersFilters {
  program: ProgramFilter;
}

const DEFAULT_FILTERS: GroupMembersFilters = { program: 'all' };

function removeFilter(state: GroupMembersFilters, id: string): GroupMembersFilters {
  if (id === 'program') return { ...state, program: 'all' };
  return state;
}

export function MembersTable({
  data,
  isLoading,
  removeMemberMutation,
  addAdminMutation,
  removeAdminMutation,
  isSuperAdminOrg,
  organizationId,
}: {
  data: GroupMemberRow[];
  isLoading?: boolean;
  removeMemberMutation: UseMutationResult<string, Error, string, unknown>;
  addAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  removeAdminMutation?: UseMutationResult<string, Error, string, unknown>;
  isSuperAdminOrg?: boolean;
  organizationId: string;
}): React.ReactElement {
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const {
    applied: filters,
    staged,
    setStaged,
    open: panelOpen,
    setOpen: setPanelOpen,
    apply: applyFilters,
    clearAll: clearAllDraft,
    removePill: removeFiltersPill,
  } = useFilterDraft<GroupMembersFilters>({
    initial: DEFAULT_FILTERS,
    removeFilter,
  });

  useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'name');
      if (existing && existing.value === debouncedSearch) return prev;
      const filtered = prev.filter((f) => f.id !== 'name');
      return debouncedSearch
        ? [...filtered, { id: 'name', value: debouncedSearch }]
        : filtered;
    });
  }, [debouncedSearch]);

  const columns = getMembersColumns({
    removeMemberMutation:
      isSuperAdminOrg && removeAdminMutation ? removeAdminMutation : removeMemberMutation,
    addAdminMutation,
    isSuperAdminOrg,
    organizationId,
  });

  const programFilteredData = useMemo(() => {
    if (filters.program === 'all') return data;
    const hasProgram = (member: GroupMemberRow): boolean =>
      Boolean(member.program_name && member.program_name !== 'Empty');
    return data.filter((member) =>
      filters.program === 'assigned' ? hasProgram(member) : !hasProgram(member),
    );
  }, [data, filters.program]);

  const table = useReactTable({
    data: programFilteredData,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
    initialState: { pagination: { pageSize: 10 } },
  });

  const filteredCount = table.getFilteredRowModel().rows.length;

  const activeFilters = useMemo(() => {
    const pills = [];
    const term = debouncedSearch.trim();
    if (term) pills.push({ id: 'search', label: `"${term}"` });
    if (filters.program !== 'all') {
      pills.push({
        id: 'program',
        label: filters.program === 'assigned' ? 'Has program' : 'No program',
      });
    }
    return pills;
  }, [debouncedSearch, filters.program]);

  const handleRemovePill = (id: string): void => {
    if (id === 'search') setSearchValue('');
    else removeFiltersPill(id);
  };

  return (
    <>
      <div className="tbar">
        <HtmlSearchField
          placeholder="Search members in this group…"
          value={searchValue}
          onChange={setSearchValue}
        />
        <span className="sp" />
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <button
            type="button"
            className={`btn btn-sec btn-sm${panelOpen ? ' btn-pri' : ''}`}
            onClick={() => {
              setStaged(filters);
              setPanelOpen(!panelOpen);
            }}
          >
            <Icon name="Funnel" size={15} />
            Filters
          </button>
          {panelOpen ? (
            <div
              className="pop"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 300,
                zIndex: 120,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div className="pop-h">
                <Icon name="Funnel" size={16} style={{ color: 'var(--navy-600)' }} />
                <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)' }}>
                  Filter members
                </span>
                <span className="sp">
                  <button
                    type="button"
                    className="ib ib-sm"
                    aria-label="Close"
                    onClick={() => setPanelOpen(false)}
                  >
                    <Icon name="X" size={17} />
                  </button>
                </span>
              </div>
              <div className="pop-b" style={{ overflowY: 'auto' }}>
                <div className="fgrp">
                  <div className="row" style={{ marginBottom: 10 }}>
                    <span className="fgrp-t" style={{ margin: 0 }}>Program</span>
                  </div>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {(
                      [
                        { label: 'All', value: 'all' as const },
                        { label: 'Assigned', value: 'assigned' as const },
                        { label: 'Not assigned', value: 'not_assigned' as const },
                      ] as const
                    ).map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`btn btn-sm ${staged.program === o.value ? 'btn-pri' : 'btn-sec'}`}
                        style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
                        onClick={() =>
                          setStaged({
                            ...staged,
                            program: staged.program === o.value ? 'all' : o.value,
                          })
                        }
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pop-f">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    clearAllDraft();
                  }}
                >
                  Clear all
                </button>
                <span className="sp" />
                <button
                  type="button"
                  className="btn btn-pri btn-sm"
                  onClick={applyFilters}
                >
                  Apply
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <ActiveFilterPills pills={activeFilters} onRemove={handleRemovePill} />

      <div className="tw">
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
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  <span className="row" style={{ gap: 8, justifyContent: 'center' }}>
                    <Icon name="LoaderCircle" size={18} className="animate-spin" />
                    Loading members…
                  </span>
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="mut" style={{ textAlign: 'center', padding: 24 }}>
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <HtmlTableFooter
          summary={
            <>
              Showing{' '}
              <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-body)' }}>
                {filteredCount}
              </b>{' '}
              member{filteredCount === 1 ? '' : 's'}
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
