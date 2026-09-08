import { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

export interface UsersTableFilters {
  organization_id?: string;
  team_id?: string;
  role: MemberRole;
}

/** Table `meta` callbacks owned by the members `UsersTable`. */
export interface UsersTableMeta {
  onRemoveMember: (profile: ProfileWithStats) => void;
}

