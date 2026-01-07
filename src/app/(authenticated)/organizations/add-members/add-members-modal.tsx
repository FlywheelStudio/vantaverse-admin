'use client';

import { useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight } from 'lucide-react';
import { useMemberData } from './hooks/use-member-data';
import { useMemberSelection } from './hooks/use-member-selection';
import { useSaveMembers } from './hooks/use-save-members';
import { filterProfiles } from './utils/filter-profiles';
import { groupProfiles } from './utils/group-profiles';
import { ThisOrgSection } from './components/this-org-section';
import { OrgGroupSection } from './components/org-group-section';
import { UnassignedSection } from './components/unassigned-section';
import type { AddMembersModalProps } from './types';

export function AddMembersModal({
  open,
  onOpenChange,
  type,
  id,
  name,
  organizationId,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set());
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [expandedThisOrg, setExpandedThisOrg] = useState(true);
  const [expandedUnassigned, setExpandedUnassigned] = useState(false);

  const { profilesData, profilesLoading, membersLoading, initialMemberIds } =
    useMemberData(open, type, id);

  const {
    selectedUserIds,
    handleToggleUser,
    handleToggleGroup,
    hasChanges,
    initialCount,
    newMemberCount,
    countChange,
    resetSelection,
  } = useMemberSelection(initialMemberIds);

  const { handleSave, isSaving } = useSaveMembers({
    type,
    id,
    name,
    organizationId,
    selectedUserIds,
    hasChanges,
    profilesData,
    onSuccess: () => onOpenChange(false),
  });

  const filteredProfiles = useMemo(() => {
    if (!profilesData?.success || !profilesData.data) return [];
    return filterProfiles(profilesData.data, searchQuery);
  }, [profilesData, searchQuery]);

  const groupedProfiles = useMemo(() => {
    return groupProfiles(
      filteredProfiles,
      initialMemberIds,
      type,
      organizationId,
    );
  }, [filteredProfiles, initialMemberIds, type, organizationId]);

  const handleCancel = () => {
    resetSelection();
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

  const isLoading = profilesLoading || membersLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[35vw] flex flex-col p-0"
        style={{ zIndex: 60 }}
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <span>{initialCount}</span>
                {countChange !== 0 && (
                  <>
                    <ArrowRight className="h-4 w-4" />
                    <span
                      className={
                        countChange > 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {newMemberCount}
                    </span>
                  </>
                )}
                <span className="text-muted-foreground">members in {name}</span>
              </div>
            </SheetTitle>
          </div>
          <Input
            placeholder="Search by email, name, org, or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-4"
          />
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 px-4">
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading...
            </div>
          ) : (
            <div className="py-4 min-w-0">
              {type === 'team' &&
                organizationId &&
                groupedProfiles.thisOrgMembers.length > 0 && (
                  <ThisOrgSection
                    members={groupedProfiles.thisOrgMembers}
                    isExpanded={expandedThisOrg}
                    onToggle={() => setExpandedThisOrg(!expandedThisOrg)}
                    type={type}
                    organizationId={organizationId}
                    selectedUserIds={selectedUserIds}
                    onToggleUser={handleToggleUser}
                    onToggleGroup={handleToggleGroup}
                  />
                )}

              {groupedProfiles.orgGroups.map((org) => (
                <OrgGroupSection
                  key={org.orgId}
                  org={org}
                  isOrgExpanded={expandedOrgs.has(org.orgId)}
                  onToggleOrg={() => toggleOrg(org.orgId)}
                  expandedTeams={expandedTeams}
                  onToggleTeam={toggleTeam}
                  type={type}
                  currentId={id}
                  selectedUserIds={selectedUserIds}
                  onToggleUser={handleToggleUser}
                  onToggleGroup={handleToggleGroup}
                />
              ))}

              {groupedProfiles.unassigned.length > 0 && (
                <UnassignedSection
                  members={groupedProfiles.unassigned}
                  isExpanded={expandedUnassigned}
                  onToggle={() => setExpandedUnassigned(!expandedUnassigned)}
                  selectedUserIds={selectedUserIds}
                  onToggleUser={handleToggleUser}
                  onToggleGroup={handleToggleGroup}
                />
              )}
            </div>
          )}
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t shrink-0 gap-2 flex-row justify-start mt-auto">
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
