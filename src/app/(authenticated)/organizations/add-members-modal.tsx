'use client';

import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, getInitials } from '@/components/ui/avatar';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getAllProfilesWithMemberships,
  getOrganizationMemberUserIds,
  updateOrganizationMembers,
} from './actions';
import { getTeamMemberUserIds, updateTeamMembers } from './teams-actions';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'organization' | 'team';
  id: string;
  name: string;
  organizationId?: string;
  currentMemberCount: number;
  onSuccess: () => void;
}

type GroupedProfile = {
  profile: ProfileWithMemberships;
  isCurrentMember: boolean;
};

type OrgGroup = {
  orgId: string;
  orgName: string;
  teams: {
    teamId: string;
    teamName: string;
    profiles: GroupedProfile[];
  }[];
  profiles: GroupedProfile[];
};

export function AddMembersModal({
  open,
  onOpenChange,
  type,
  id,
  name,
  organizationId,
  currentMemberCount,
  onSuccess,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [initialMemberIds, setInitialMemberIds] = useState<Set<string>>(
    new Set(),
  );
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [expandedThisOrg, setExpandedThisOrg] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles-with-memberships'],
    queryFn: getAllProfilesWithMemberships,
    enabled: open,
  });

  const { data: currentMembersData, isLoading: membersLoading } = useQuery({
    queryKey: [type === 'organization' ? 'org-members' : 'team-members', id],
    queryFn: () =>
      type === 'organization'
        ? getOrganizationMemberUserIds(id)
        : getTeamMemberUserIds(id),
    enabled: open,
  });

  useEffect(() => {
    if (currentMembersData?.success && currentMembersData.data) {
      const memberIds = new Set(currentMembersData.data);
      setInitialMemberIds(memberIds);
      setSelectedUserIds(memberIds);
    }
  }, [currentMembersData]);

  const filteredProfiles = useMemo(() => {
    if (!profilesData?.success || !profilesData.data) return [];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return profilesData.data;

    return profilesData.data.filter((profile) => {
      const username = profile.username?.toLowerCase() || '';
      const firstName = profile.first_name?.toLowerCase() || '';
      const lastName = profile.last_name?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const orgNames = profile.orgMemberships
        .map((m) => m.orgName.toLowerCase())
        .join(' ');
      const teamNames = profile.teamMemberships
        .map((m) => m.teamName.toLowerCase())
        .join(' ');

      return (
        username.includes(query) ||
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query) ||
        orgNames.includes(query) ||
        teamNames.includes(query)
      );
    });
  }, [profilesData, searchQuery]);

  const groupedProfiles = useMemo(() => {
    if (!filteredProfiles.length) return { orgGroups: [], thisOrgMembers: [] };

    const thisOrgMembers: GroupedProfile[] = [];
    const orgMap = new Map<string, OrgGroup>();

    filteredProfiles.forEach((profile) => {
      const isCurrentMember = initialMemberIds.has(profile.id);
      const groupedProfile: GroupedProfile = { profile, isCurrentMember };

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
    };
  }, [filteredProfiles, initialMemberIds, type, organizationId]);

  const handleToggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const hasChanges = useMemo(() => {
    if (selectedUserIds.size !== initialMemberIds.size) return true;
    for (const id of selectedUserIds) {
      if (!initialMemberIds.has(id)) return true;
    }
    for (const id of initialMemberIds) {
      if (!selectedUserIds.has(id)) return true;
    }
    return false;
  }, [selectedUserIds, initialMemberIds]);

  const newMemberCount = selectedUserIds.size;
  const countChange = newMemberCount - currentMemberCount;

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      const userIds = Array.from(selectedUserIds);
      const result =
        type === 'organization'
          ? await updateOrganizationMembers(id, userIds)
          : await updateTeamMembers(id, userIds);

      if (result.success && result.data) {
        const { added, removed } = result.data;
        let message = 'Success! ';
        if (added > 0 && removed > 0) {
          message += `${added} members added, ${removed} members removed from ${name}`;
        } else if (added > 0) {
          message += `${added} members added to ${name}`;
        } else if (removed > 0) {
          message += `${removed} members removed from ${name}`;
        }

        toast.success(message);
        onSuccess();
        onOpenChange(false);
      } else if (!result.success) {
        toast.error(result.error || 'Failed to update members');
      }
    } catch (error) {
      console.error('Error updating members:', error);
      toast.error('Failed to update members');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedUserIds(new Set(initialMemberIds));
    onOpenChange(false);
  };

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  const toggleTeam = (teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const renderProfile = (groupedProfile: GroupedProfile) => {
    const { profile } = groupedProfile;
    const isSelected = selectedUserIds.has(profile.id);
    const displayName =
      profile.first_name && profile.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : profile.username || profile.email || 'Unknown';

    return (
      <div
        key={profile.id}
        className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 cursor-pointer"
        onClick={() => handleToggleUser(profile.id)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleUser(profile.id)}
          onClick={(e) => e.stopPropagation()}
        />
        <Avatar
          src={profile.avatar_url || null}
          alt={displayName}
          size={32}
          initials={getInitials(
            profile.first_name,
            profile.last_name,
            profile.username,
            displayName,
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {displayName}
          </div>
          {profile.username && (
            <div className="text-xs text-muted-foreground truncate">
              @{profile.username}
            </div>
          )}
        </div>
      </div>
    );
  };

  const isLoading = profilesLoading || membersLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col p-0"
        style={{ zIndex: 60 }}
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <span>{currentMemberCount}</span>
                <ArrowRight className="h-4 w-4" />
                <span
                  className={
                    countChange !== 0
                      ? countChange > 0
                        ? 'text-green-600'
                        : 'text-red-600'
                      : ''
                  }
                >
                  {newMemberCount}
                </span>
                <span className="text-muted-foreground">members in {name}</span>
              </div>
            </SheetTitle>
          </div>
          <Input
            placeholder="Search by username, name, org, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-4"
          />
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="py-4">
              {type === 'team' &&
                organizationId &&
                groupedProfiles.thisOrgMembers.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setExpandedThisOrg(!expandedThisOrg)}
                      className="flex items-center gap-2 w-full px-2 py-2 font-semibold text-sm hover:bg-muted/50 rounded"
                    >
                      {expandedThisOrg ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <span>This organization&apos;s members</span>
                      <span className="ml-auto text-muted-foreground text-xs">
                        ({groupedProfiles.thisOrgMembers.length})
                      </span>
                    </button>
                    {expandedThisOrg && (
                      <div className="ml-6">
                        {groupedProfiles.thisOrgMembers.map((groupedProfile) =>
                          renderProfile(groupedProfile),
                        )}
                      </div>
                    )}
                  </div>
                )}

              {groupedProfiles.orgGroups.map((org) => (
                <div key={org.orgId} className="mb-4">
                  <button
                    onClick={() => toggleOrg(org.orgId)}
                    className="flex items-center gap-2 w-full px-2 py-2 font-semibold text-sm hover:bg-muted/50 rounded"
                  >
                    {expandedOrgs.has(org.orgId) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>{org.orgName}</span>
                    <span className="ml-auto text-muted-foreground text-xs">
                      (
                      {org.teams.reduce(
                        (sum, t) => sum + t.profiles.length,
                        0,
                      ) + org.profiles.length}
                      )
                    </span>
                  </button>

                  {expandedOrgs.has(org.orgId) && (
                    <div className="ml-6">
                      {org.teams.map((team) => (
                        <div key={team.teamId} className="mb-2">
                          <button
                            onClick={() => toggleTeam(team.teamId)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-muted/50 rounded"
                          >
                            {expandedTeams.has(team.teamId) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{team.teamName}</span>
                            <span className="ml-auto text-muted-foreground text-xs">
                              ({team.profiles.length})
                            </span>
                          </button>
                          {expandedTeams.has(team.teamId) && (
                            <div className="ml-6">
                              {team.profiles.map((groupedProfile) =>
                                renderProfile(groupedProfile),
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {org.profiles.map((groupedProfile) =>
                        renderProfile(groupedProfile),
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t shrink-0 gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="bg-[#2454FF] hover:bg-[#1E3FCC]"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
