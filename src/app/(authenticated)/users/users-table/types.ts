import { MemberRole } from '@/lib/supabase/schemas/organization-members';

export interface UsersTableFilters {
  organization_id?: string;
  team_id?: string;
  role: MemberRole;
}

