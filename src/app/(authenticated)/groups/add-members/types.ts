import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';

export interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'organization' | 'team';
  id: string;
  name: string;
  organizationId?: string;
  organizationName?: string;
  initialRole?: MemberRole;
}

export type GroupedProfile = {
  profile: ProfileWithMemberships;
  isCurrentMember: boolean;
};
