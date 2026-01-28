'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
      <DialogContent
        className={
          'w-[min(760px,calc(100%-2rem))] h-[680px] max-h-[85vh] flex flex-col overflow-hidden ' +
          'border border-border bg-card text-card-foreground p-5 ' +
          'rounded-xl shadow-md'
        }
      >
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
            <DialogTitle className="text-[1.125rem] font-normal tracking-tight text-muted-foreground">
              {inviteTitle} to{' '}
              <span className="font-semibold text-foreground">
                {targetLabel} ({targetKind})
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Role Selection */}
          <div className="pt-5 pb-2">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('patient')}
                className={
                  'cursor-pointer p-4 text-left transition-all rounded-lg ' +
                  (selectedRole === 'patient'
                    ? 'border-2 border-primary bg-primary/10'
                    : 'border border-border bg-card hover:border-muted-foreground/40')
                }
              >
                <div className="text-base font-semibold text-foreground mb-1">
                  Member
                </div>
                <div className="text-[0.875rem] text-muted-foreground">
                  Participates in program
                </div>
              </button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() =>
                      !isPhysiologistDisabled && setSelectedRole('admin')
                    }
                    disabled={isPhysiologistDisabled}
                    className={
                      'cursor-pointer p-4 text-left transition-all rounded-lg ' +
                      (isPhysiologistDisabled
                        ? 'border border-border bg-muted cursor-not-allowed opacity-60'
                        : selectedRole === 'admin'
                          ? 'border-2 border-primary bg-primary/10'
                          : 'border border-border bg-card hover:border-muted-foreground/40')
                    }
                  >
                    <div className="text-base font-semibold text-foreground mb-1">
                      Physiologist
                    </div>
                    <div className="text-[0.875rem] text-muted-foreground">
                      Co-manages group
                    </div>
                  </button>
                </TooltipTrigger>
                {isPhysiologistDisabled && (
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
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
              className="h-11 rounded-md px-4 text-[0.875rem] bg-card border border-border"
            />
            {selectedRole === 'patient' && (
              <div className="flex items-center justify-between rounded-lg p-2 bg-muted border border-border">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[0.875rem] text-primary hover:underline font-medium"
                  >
                    Select All
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="view-unassigned"
                    checked={viewUnassigned}
                    onCheckedChange={(checked) =>
                      setViewUnassigned(checked === true)
                    }
                    className="rounded-xs"
                  />
                  <label
                    htmlFor="view-unassigned"
                    className="text-[0.875rem] text-muted-foreground cursor-pointer"
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
              <div className="py-8 text-center text-[0.875rem] text-muted-foreground">
                Loading...
              </div>
            ) : (
              <div className="space-y-1 pr-1">
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
                  <div className="py-8 text-center text-[0.875rem] text-muted-foreground">
                    No users found
                  </div>
                ) : (
                  filteredProfiles.map((profile) => {
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 mt-auto border-t border-border">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="h-11 px-5 rounded-pill"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || isPending}
              className="h-11 px-5 rounded-pill shadow-md"
            >
              {(isPending || membersLoading) && (
                <Loader className="h-4 w-4 animate-spin shrink-0" />
              )}
              {!isPending &&
                !membersLoading &&
                (selectedRole === 'patient'
                  ? countChange === 0
                    ? `Add ${initialCount} Member${initialCount !== 1 ? 's' : ''}`
                    : `Add ${initialCount} → ${newMemberCount} Member${newMemberCount !== 1 ? 's' : ''}`
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
