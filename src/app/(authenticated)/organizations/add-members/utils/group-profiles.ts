import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';
import type { GroupedProfile, OrgGroup, GroupedProfilesResult } from '../types';

export function groupProfiles(
  filteredProfiles: ProfileWithMemberships[],
  initialMemberIds: Set<string>,
  type: 'organization' | 'team',
  organizationId?: string,
): GroupedProfilesResult {
  if (!filteredProfiles.length)
    return { orgGroups: [], thisOrgMembers: [], unassigned: [] };

  const thisOrgMembers: GroupedProfile[] = [];
  const unassigned: GroupedProfile[] = [];
  const orgMap = new Map<string, OrgGroup>();

  filteredProfiles.forEach((profile) => {
    const isCurrentMember = initialMemberIds.has(profile.id);
    const groupedProfile: GroupedProfile = { profile, isCurrentMember };

    // Check if profile has no memberships
    if (
      profile.orgMemberships.length === 0 &&
      profile.teamMemberships.length === 0
    ) {
      unassigned.push(groupedProfile);
      return;
    }

    if (type === 'team' && organizationId) {
      const isOrgMember = profile.orgMemberships.some(
        (m) => m.orgId === organizationId,
      );
      if (isOrgMember) {
        thisOrgMembers.push(groupedProfile);
      }
    }

    profile.orgMemberships.forEach((orgMem) => {
      if (!orgMap.has(orgMem.orgId)) {
        orgMap.set(orgMem.orgId, {
          orgId: orgMem.orgId,
          orgName: orgMem.orgName,
          teams: [],
          profiles: [],
        });
      }
    });

    profile.teamMemberships.forEach((teamMem) => {
      if (!orgMap.has(teamMem.orgId)) {
        orgMap.set(teamMem.orgId, {
          orgId: teamMem.orgId,
          orgName: teamMem.orgName,
          teams: [],
          profiles: [],
        });
      }

      const org = orgMap.get(teamMem.orgId)!;
      let team = org.teams.find((t) => t.teamId === teamMem.teamId);
      if (!team) {
        team = {
          teamId: teamMem.teamId,
          teamName: teamMem.teamName,
          profiles: [],
        };
        org.teams.push(team);
      }
      team.profiles.push(groupedProfile);
    });

    profile.orgMemberships.forEach((orgMem) => {
      const org = orgMap.get(orgMem.orgId)!;
      const hasTeamInOrg = profile.teamMemberships.some(
        (tm) => tm.orgId === orgMem.orgId,
      );
      if (!hasTeamInOrg) {
        org.profiles.push(groupedProfile);
      }
    });
  });

  return {
    orgGroups: Array.from(orgMap.values()),
    thisOrgMembers,
    unassigned,
  };
}
