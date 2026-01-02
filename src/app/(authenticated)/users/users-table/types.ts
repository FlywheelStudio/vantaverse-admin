import type { ColumnDef } from '@tanstack/react-table';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

export interface UsersTableFilters {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
}

export interface UsersTableProps {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  filters?: UsersTableFilters;
  onFiltersChange?: (filters: UsersTableFilters) => void;
  isLoading?: boolean;
}

export interface QuickAddUserData {
  organizationId?: string;
  teamId?: string;
  firstName: string;
  lastName: string;
  email: string;
}
