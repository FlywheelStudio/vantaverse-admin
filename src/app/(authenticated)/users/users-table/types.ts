import type { ColumnDef } from '@tanstack/react-table';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

export interface UsersTableFilters {
  organization_id?: string;
  team_id?: string;
  role: MemberRole;
}

export interface UsersTableProps {
  columns: ColumnDef<ProfileWithStats>[];
  data: ProfileWithStats[];
  filters: UsersTableFilters;
  onFiltersChange: (filters: UsersTableFilters) => void;
  isLoading?: boolean;
}
