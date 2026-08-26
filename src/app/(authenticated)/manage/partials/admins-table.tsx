'use client';

import { useMemo } from 'react';
import { flexRender } from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';

import { useUsersTable } from '../../users/users-table/hooks/use-users-table';
import { UsersTablePagination } from '../../users/users-table/components/pagination';
import { HtmlSearchField } from '../../users/html-helpers';
import { ActiveFilterPills, useFilterDraft } from '@/components/filters';
import { Icon } from '@/components/medvanta';
import {
  AdminsFilterPanel,
  DEFAULT_ADMINS_FILTERS,
  countAdminsActiveFilters,
  removeAdminsFilter,
  type AdminsFilters,
} from './admins-filter-panel';
import { adminColumns } from './columns';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

interface AdminsTableProps {
  data: ProfileWithStats[];
  isLoading?: boolean;
}

/** Client-side facet filtering for admins (kept outside render for purity). */
function applyAdminsFilters(data: ProfileWithStats[], filters: AdminsFilters): ProfileWithStats[] {
  return data.filter((admin) => {
    if (filters.status !== 'all' && admin.status !== filters.status) return false;
    if (filters.lastActive !== 'all') {
      if (filters.lastActive === 'never') {
        if (admin.last_sign_in) return false;
      } else {
        const days =
          filters.lastActive === '7d' ? 7 : filters.lastActive === '30d' ? 30 : 90;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        if (!admin.last_sign_in || new Date(admin.last_sign_in).getTime() < cutoff) {
          return false;
        }
      }
    }
    if (filters.joined !== 'all') {
      if (!admin.created_at) return false;
      const created = new Date(admin.created_at);
      if (Number.isNaN(created.getTime())) return false;
      const now = new Date();
      if (
        filters.joined === 'month' &&
        (created.getFullYear() !== now.getFullYear() ||
          created.getMonth() !== now.getMonth())
      ) {
        return false;
      }
      if (
        filters.joined === 'quarter' &&
        created < new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      ) {
        return false;
      }
      if (filters.joined === 'year' && created.getFullYear() !== now.getFullYear()) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Admins-only table.
 *
 * Deliberately not `UsersTable` — that one hard-wires the Members/Admins role
 * tabs, a program-due-date filter, and a bulk bar that invites as non-admin,
 * none of which apply here.
 */
export function AdminsTable({
  data,
  isLoading = false,
}: AdminsTableProps): React.ReactElement {
  const {
    applied: filters,
    staged,
    setStaged,
    open: panelOpen,
    setOpen: setPanelOpen,
    apply: applyFilters,
    clearAll: clearAllDraft,
    removePill: removeFiltersPill,
  } = useFilterDraft<AdminsFilters>({
    initial: DEFAULT_ADMINS_FILTERS,
    removeFilter: removeAdminsFilter,
  });

  const filteredData = useMemo(
    () => applyAdminsFilters(data, filters),
    [data, filters],
  );

  const { table, searchValue, setSearchValue } = useUsersTable({
    columns: adminColumns,
    data: filteredData,
    filters: { role: 'admin' },
  });

  const activeFilters = useMemo(() => {
    const pills = [];
    const term = searchValue.trim();
    if (term) pills.push({ id: 'search', label: `"${term}"` });
    if (filters.status !== 'all') {
      pills.push({
        id: 'status',
        label:
          filters.status === 'pending'
            ? 'Pending'
            : filters.status === 'invited'
              ? 'Invited'
              : 'Active',
      });
    }
    if (filters.lastActive !== 'all') {
      pills.push({
        id: 'lastActive',
        label:
          filters.lastActive === 'never'
            ? 'Never signed in'
            : `Active in last ${filters.lastActive.replace('d', '')} days`,
      });
    }
    if (filters.joined !== 'all') {
      pills.push({
        id: 'joined',
        label: `Joined this ${filters.joined === 'month' ? 'month' : filters.joined === 'quarter' ? 'quarter' : 'year'}`,
      });
    }
    return pills;
  }, [searchValue, filters]);

  const handleRemovePill = (id: string): void => {
    if (id === 'search') setSearchValue('');
    else removeFiltersPill(id);
  };

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <div className="tbar">
          <HtmlSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search admins by name or email…"
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
              {countAdminsActiveFilters(filters) > 0 ? (
                <span className="bdg bdg-b">{countAdminsActiveFilters(filters)}</span>
              ) : null}
            </button>
            <AdminsFilterPanel
              open={panelOpen}
              onClose={() => setPanelOpen(false)}
              activeCount={countAdminsActiveFilters(staged)}
              filters={staged}
              onChange={setStaged}
              onClear={clearAllDraft}
              onApply={applyFilters}
            />
          </div>
        </div>
      </div>

      <ActiveFilterPills pills={activeFilters} onRemove={handleRemovePill} />

      <div className="tw" style={{ overflow: 'visible' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={
                        header.id === 'select'
                          ? { width: 40 }
                          : header.id === 'actions'
                            ? { textAlign: 'right', width: 52 }
                            : undefined
                      }
                      className={header.column.getCanSort() ? 'srt' : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={adminColumns.length}
                    style={{ textAlign: 'center' }}
                  >
                    <div
                      className="row"
                      style={{ justifyContent: 'center', gap: 8 }}
                    >
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
                      <span className="mut">Loading admins…</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        style={
                          cell.column.id === 'actions'
                            ? { textAlign: 'right', width: 52 }
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={adminColumns.length}
                    style={{ textAlign: 'center' }}
                  >
                    <span className="mut">
                      {searchValue
                        ? 'No admins match that search.'
                        : 'No admins yet. Invite one to get started.'}
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <UsersTablePagination table={table} noun="admins" />
      </div>
    </>
  );
}
