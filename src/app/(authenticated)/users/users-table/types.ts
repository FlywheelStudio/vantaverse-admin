import type { ColumnDef } from '@tanstack/react-table';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

export interface UsersTableFilters {
  organization_id?: string;
  team_id?: string;
  role?: 'admin' | 'user';
}

export interface UsersTableProps {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  filters: UsersTableFilters;
  onFiltersChange: (filters: UsersTableFilters) => void;
  isLoading?: boolean;
}
