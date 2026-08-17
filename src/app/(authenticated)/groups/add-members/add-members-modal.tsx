'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Checkbox,
  Dialog,
  Input,
  Tooltip,
} from '@/components/medvanta';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemberData } from './hooks/use-member-data';
import { useMemberSelection } from './hooks/use-member-selection';
import { useSaveMembers } from './hooks/use-save-members';
import { filterProfiles } from './utils/filter-profiles';
import { ProfileItem } from './components/profile-item';
import type { AddMembersModalProps } from './types';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';
import { cn } from '@/lib/utils';

function filterByRole(
  profiles: ProfileWithMemberships[],
  role: MemberRole,
): ProfileWithMemberships[] {
  if (role === 'patient') {
    return profiles.filter((profile) => {
      const hasAdminRole = (profile.orgMemberships ?? []).some(
        (om) => om.role === 'admin',
      );
      return !hasAdminRole;
    });
  }

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
}: AddMembersModalProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    initialRole ?? 'patient',
  );
  const [viewUnassigned, setViewUnassigned] = useState(true);

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

  const filteredProfiles = useMemo(() => {
    if (!profilesData?.success || !profilesData.data) return [];

    let filtered = filterByRole(profilesData.data, selectedRole);
    filtered = filterProfiles(filtered, searchQuery);

    if (selectedRole === 'patient' && viewUnassigned) {
      filtered = filtered.filter(
        (profile) =>
          (profile.orgMemberships?.length ?? 0) === 0 &&
          (profile.teamMemberships?.length ?? 0) === 0,
      );
    }

    return filtered;
  }, [profilesData, selectedRole, searchQuery, viewUnassigned]);

  const allUserIds = useMemo(
    () => filteredProfiles.map((p) => p.id),
    [filteredProfiles],
  );

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

  const handleSelectAll = (): void => {
    if (selectedRole === 'patient') {
      handleToggleGroup(allUserIds, 'patient');
    }
  };

  const handleCancel = (): void => {
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

  const inviteTitle =
    selectedRole === 'admin' ? 'Invite admins' : 'Invite members';
  const targetLabel =
    type === 'team' && organizationName ? `${organizationName}/${name}` : name;
  const targetKind = type === 'organization' ? 'Group' : 'Team';

  const saveLabel =
    isPending || membersLoading
      ? 'Saving...'
      : selectedRole === 'patient'
        ? countChange === 0
          ? `Add ${initialCount} Member${initialCount !== 1 ? 's' : ''}`
          : `Add ${initialCount} → ${newMemberCount} Member${newMemberCount !== 1 ? 's' : ''}`
        : hasPhysiologistSelected
          ? currentPhysiologistName
            ? 'Replace Physiologist'
            : 'Assign Physiologist'
          : 'Assign Physiologist';

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      title={
        <>
          {inviteTitle} to{' '}
          <span className="text-[var(--text-strong)]">
            {targetLabel} ({targetKind})
          </span>
        </>
      }
      width={760}
      className="flex max-h-[85vh] flex-col overflow-hidden"
      footer={
        <>
          <Button variant="secondary" onClick={handleCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave || isPending} loading={isPending}>
            {saveLabel}
          </Button>
        </>
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
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="pb-2 pt-1">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedRole('patient')}
              className={cn(
                'cursor-pointer rounded-[var(--radius-md)] p-4 text-left transition-all',
                selectedRole === 'patient'
                  ? 'border-2 border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_10%,var(--surface-card))]'
                  : 'border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]',
              )}
            >
              <div className="mb-1 text-[length:var(--text-base)] font-[var(--fw-semibold)] text-[var(--text-strong)]">
                Member
              </div>
              <div className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                Participates in program
              </div>
            </button>

            <Tooltip
              label={
                isPhysiologistDisabled
                  ? 'Physiologist is managed at organization level and applies to all teams in the organization'
                  : 'Co-manages group'
              }
            >
              <button
                type="button"
                onClick={() =>
                  !isPhysiologistDisabled && setSelectedRole('admin')
                }
                disabled={isPhysiologistDisabled}
                className={cn(
                  'w-full cursor-pointer rounded-[var(--radius-md)] p-4 text-left transition-all',
                  isPhysiologistDisabled
                    ? 'cursor-not-allowed border border-[var(--border-subtle)] bg-[var(--slate-50)] opacity-60'
                    : selectedRole === 'admin'
                      ? 'border-2 border-[var(--primary)] bg-[color-mix(in_oklch,var(--primary)_10%,var(--surface-card))]'
                      : 'border border-[var(--border-subtle)] bg-[var(--surface-card)] hover:border-[var(--border-strong)]',
                )}
              >
                <div className="mb-1 text-[length:var(--text-base)] font-[var(--fw-semibold)] text-[var(--text-strong)]">
                  Physiologist
                </div>
                <div className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                  Co-manages group
                </div>
              </button>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            iconLeft="Search"
          />
          {selectedRole === 'patient' ? (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--slate-50)] p-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--primary)] hover:underline"
              >
                Select All
              </button>
              <Checkbox
                checked={viewUnassigned}
                onChange={setViewUnassigned}
                label="View unassigned"
              />
            </div>
          ) : null}
        </div>

        <ScrollArea className="mt-4 min-h-0 flex-1" style={{ maxHeight: 320 }}>
          {isLoading ? (
            <div className="py-8 text-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
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
                <div className="py-8 text-center text-[length:var(--text-sm)] text-[var(--text-muted)]">
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
      </motion.div>
    </Dialog>
  );
}
