'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMemberData } from './hooks/use-member-data';
import { useMemberSelection } from './hooks/use-member-selection';
import { useSaveMembers } from './hooks/use-save-members';
import { filterProfiles } from './utils/filter-profiles';
import { ProfileItem } from './components/profile-item';
import type { AddMembersModalProps } from './types';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

/**
 * Filter profiles by role (patient vs admin/physiologist)
 */
function filterByRole(
  profiles: ProfileWithMemberships[],
  role: MemberRole,
): ProfileWithMemberships[] {
  if (role === 'patient') {
    // Members tab: show all non-admins
    return profiles.filter((profile) => {
      const hasAdminRole = (profile.orgMemberships ?? []).some(
        (om) => om.role === 'admin',
      );
      return !hasAdminRole;
    });
  }

  // Physiologist tab: show only admins
  return profiles.filter((profile) => {
    const hasAdminRole = (profile.orgMemberships ?? []).some(
      (om) => om.role === 'admin',
    );
    return hasAdminRole;
  });
}

export function AddMembersModal({
  open,
  onOpenChange,
  type,
  id,
  name,
  organizationId,
  organizationName,
  initialRole,
}: AddMembersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    initialRole ?? 'patient',
  );
  const [viewUnassigned, setViewUnassigned] = useState(true);

  useEffect(() => {
    if (!open) return;
    startTransition(() => {
      setSelectedRole(initialRole ?? 'patient');
    });
  }, [open, initialRole]);

  const {
    profilesData,
    profilesLoading,
    membersLoading,
    initialMemberIds,
    initialPhysiologistId,
    currentPhysiologist,
  } = useMemberData(open, type, id, organizationId);

  const {
    selectedMemberIds,
    selectedPhysiologistId,
    handleToggleUser,
    handleToggleGroup,
    hasChanges,
    initialCount,
    newMemberCount,
    countChange,
    resetSelection,
    clearAll,
  } = useMemberSelection({
    initialMemberIds,
    initialPhysiologistId,
  });

  const { handleSave, isPending } = useSaveMembers({
    type,
    id,
    name,
    organizationId,
    selectedRole,
    selectedMemberIds,
    selectedPhysiologistId,
    hasChanges: hasChanges(selectedRole),
    profilesData,
    onSuccess: () => onOpenChange(false),
  });

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    if (!profilesData?.success || !profilesData.data) return [];

    let filtered = filterByRole(profilesData.data, selectedRole);
    filtered = filterProfiles(filtered, searchQuery);

    // Filter by unassigned if checkbox is checked (only for Members tab)
    if (selectedRole === 'patient' && viewUnassigned) {
      filtered = filtered.filter(
        (profile) =>
          (profile.orgMemberships?.length ?? 0) === 0 &&
          (profile.teamMemberships?.length ?? 0) === 0,
      );
    }

    return filtered;
  }, [profilesData, selectedRole, searchQuery, viewUnassigned]);

  // Get all user IDs for select all/clear
  const allUserIds = useMemo(
    () => filteredProfiles.map((p) => p.id),
    [filteredProfiles],
  );

  // Find current physiologist profile
  const currentPhysiologistProfile = useMemo(() => {
    if (
      selectedRole === 'admin' &&
      currentPhysiologist &&
      profilesData?.success &&
      profilesData.data
    ) {
      return profilesData.data.find((p) => p.id === currentPhysiologist.userId);
    }
    return null;
  }, [selectedRole, currentPhysiologist, profilesData]);

  const handleSelectAll = () => {
    if (selectedRole === 'patient') {
      handleToggleGroup(allUserIds, 'patient');
    }
  };

  const handleClear = () => {
    clearAll(selectedRole);
  };

  const handleCancel = () => {
    resetSelection();
    setSearchQuery('');
    setViewUnassigned(true);
    setSelectedRole('patient');
    onOpenChange(false);
  };

  const isLoading = profilesLoading || membersLoading;
  const isPhysiologistDisabled = type === 'team';
  const hasPhysiologistSelected = selectedPhysiologistId !== null;
  const currentPhysiologistName = currentPhysiologist
    ? `${currentPhysiologist.firstName} ${currentPhysiologist.lastName}`
    : null;

  const canSave =
    hasChanges(selectedRole) &&
    !isPending &&
    (selectedRole === 'patient'
      ? selectedMemberIds.size > 0
      : selectedPhysiologistId !== null);

  const inviteTitle = selectedRole === 'admin' ? 'Invite physicians' : 'Invite members';
  const targetLabel =
    type === 'team' && organizationName ? `${organizationName}/${name}` : name;
  const targetKind = type === 'organization' ? 'Group' : 'Team';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : handleCancel())}
    >
      <DialogContent className="w-[min(760px,calc(100%-2rem))] h-[680px] max-h-[85vh] flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={
            open
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.95, y: 20 }
          }
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogHeader>
            <DialogTitle className="text-[#1E3A5F]">
              {inviteTitle}
            </DialogTitle>
            <DialogDescription>
              {targetLabel} ({targetKind})
            </DialogDescription>
          </DialogHeader>

          {/* Role Selection Tabs */}
          <div className="pt-4 pb-2">
            <div className="text-sm font-medium mb-3">Assign Role</div>
            <div className="grid grid-cols-2 gap-4">
              {/* Member Tab */}
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={`cursor-pointer p-4 border-2 rounded-lg text-left transition-all ${
                  selectedRole === 'patient'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-base mb-1 justify-self-center">
                  Member
                </div>
                <div className="text-sm text-muted-foreground justify-self-center">
                  Participates in program
                </div>
              </button>

              {/* Physiologist Tab */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      !isPhysiologistDisabled && setSelectedRole('admin')
                    }
                    disabled={isPhysiologistDisabled}
                    className={`cursor-pointer p-4 border-2 rounded-lg text-left transition-all ${
                      isPhysiologistDisabled
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        : selectedRole === 'admin'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-base mb-1 justify-self-center">
                      Physiologist
                    </div>
                    <div className="text-sm text-muted-foreground justify-self-center">
                      Co-manages group
                    </div>
                  </button>
                </TooltipTrigger>
                {isPhysiologistDisabled && (
                  <TooltipContent>
                    <p>
                      Physiologist is managed at organization level and applies
                      to all teams in the organization
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {selectedRole === 'patient' && (
              <div className="flex items-center justify-between border-2 rounded-lg p-2 bg-gray-50">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="view-unassigned"
                    checked={viewUnassigned}
                    onCheckedChange={(checked) =>
                      setViewUnassigned(checked === true)
                    }
                  />
                  <label
                    htmlFor="view-unassigned"
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    View unassigned
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* User List */}
          <ScrollArea className="flex-1 min-h-0 mt-4">
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="space-y-1">
                {/* Show current physiologist at top of Physiologist tab */}
                {selectedRole === 'admin' &&
                  currentPhysiologist &&
                  currentPhysiologistProfile &&
                  initialPhysiologistId && (
                    <ProfileItem
                      key={currentPhysiologist.userId}
                      groupedProfile={{
                        profile: currentPhysiologistProfile,
                        isCurrentMember: false,
                      }}
                      isSelected={
                        selectedPhysiologistId === initialPhysiologistId
                      }
                      onToggle={() => {
                        if (isPhysiologistDisabled) return;
                        handleToggleUser(currentPhysiologist.userId, 'admin');
                      }}
                    />
                  )}
                {filteredProfiles.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  filteredProfiles.map((profile) => {
                    // Skip current physiologist if already shown at top
                    if (
                      selectedRole === 'admin' &&
                      currentPhysiologistProfile &&
                      profile.id === currentPhysiologistProfile.id
                    ) {
                      return null;
                    }

                    const isSelected =
                      selectedRole === 'patient'
                        ? selectedMemberIds.has(profile.id)
                        : selectedPhysiologistId === profile.id;

                    return (
                      <ProfileItem
                        key={profile.id}
                        groupedProfile={{
                          profile,
                          isCurrentMember: initialMemberIds.has(profile.id),
                        }}
                        isSelected={isSelected}
                        onToggle={() => {
                          if (
                            selectedRole === 'admin' &&
                            isPhysiologistDisabled
                          ) {
                            return;
                          }
                          handleToggleUser(profile.id, selectedRole);
                        }}
                      />
                    );
                  })
                )}
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 mt-auto border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {(isPending || membersLoading) && (
                <Loader className="h-4 w-4 animate-spin" />
              )}
              {!isPending &&
                !membersLoading &&
                (selectedRole === 'patient'
                  ? countChange === 0
                    ? `Add ${initialCount} Member${initialCount !== 1 ? 's' : ''}`
                    : `Add ${initialCount} -> ${newMemberCount} Member${newMemberCount !== 1 ? 's' : ''}`
                  : hasPhysiologistSelected
                    ? currentPhysiologistName
                      ? 'Replace Physiologist'
                      : 'Assign Physiologist'
                    : 'Assign Physiologist')}
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
