import { useEffect, useState } from 'react';
import {
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
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { UsersTableFilters } from '../types';

interface UseUsersTableParams {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  filters: UsersTableFilters;
}

export function useUsersTable({
  columns,
  data,
  filters = { role: 'patient' },
}: UseUsersTableParams) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Update name filter when search value changes
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

  // Update role filter in table when prop changes
  useEffect(() => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.id === 'is_super_admin');
      const role = filters.role || 'patient';
      const roleValue = role === 'admin' ? true : false;
      if (existing && existing.value === roleValue) {
        return prev;
      }
      const filtered = prev.filter((f) => f.id !== 'is_super_admin');
      return [...filtered, { id: 'is_super_admin', value: roleValue }];
    });
  }, [filters.role]);

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

  return {
    table,
    searchValue,
    setSearchValue,
  };
}
