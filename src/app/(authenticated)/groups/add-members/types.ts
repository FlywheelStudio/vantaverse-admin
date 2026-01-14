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

export type OrgGroup = {
  orgId: string;
  orgName: string;
  teams: {
    teamId: string;
    teamName: string;
    profiles: GroupedProfile[];
  }[];
  profiles: GroupedProfile[];
};

export type GroupedProfilesResult = {
  orgGroups: OrgGroup[];
  thisOrgMembers: GroupedProfile[];
  unassigned: GroupedProfile[];
};
