import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

export interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'organization' | 'team';
  id: string;
  name: string;
  organizationId?: string;
}

export type GroupedProfile = {
  profile: ProfileWithMemberships;
  isCurrentMember: boolean;
};
