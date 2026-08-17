'use client';

import { useState, useMemo } from 'react';
import {
  Avatar,
  Checkbox,
  Icon,
  Input,
  Tooltip,
} from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { useMemberData } from './hooks/use-member-data';
import { useMemberSelection } from './hooks/use-member-selection';
import { useSaveMembers } from './hooks/use-save-members';
import { filterProfiles } from './utils/filter-profiles';
import type { AddMembersModalProps } from './types';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

function MemberSelectRow({
  profile,
  isSelected,
  isCurrentMember,
  onToggle,
  disabled,
}: {
  profile: ProfileWithMemberships;
  isSelected: boolean;
  isCurrentMember: boolean;
  onToggle: () => void;
  disabled?: boolean;
}): React.ReactElement {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email ||
    'Unknown';

  return (
    <button
      type="button"
      className={`lrow${isSelected ? ' on' : ''}`}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className={`cb${isSelected ? ' on' : ''}`}>
        {isSelected ? <Icon name="Check" size={14} /> : null}
      </span>
      <Avatar name={name} src={profile.avatar_url ?? undefined} size="sm" />
      <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <span className="nm">{name}</span>
        <span className="em">{profile.email ?? '—'}</span>
      </span>
      {isCurrentMember ? <span className="bdg">Member</span> : null}
    </button>
  );
}

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
    <HtmlModal
      open={open}
      title={inviteTitle}
      subtitle={`${targetLabel} (${targetKind})`}
      onClose={handleCancel}
      width={560}
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleCancel} disabled={isPending}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-pri"
            onClick={handleSave}
            disabled={!canSave || isPending}
          >
            {isPending ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="UserPlus" size={17} />
            )}
            {saveLabel}
          </button>
        </>
      }
    >
      <div className="g g2" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={`choice${selectedRole === 'patient' ? ' on' : ''}`}
          onClick={() => setSelectedRole('patient')}
        >
          <span className="rd" />
          <span>
            <span className="ct">Member</span>
            <span className="cs">Participates in program</span>
          </span>
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
            className={`choice${selectedRole === 'admin' ? ' on' : ''}`}
            onClick={() => !isPhysiologistDisabled && setSelectedRole('admin')}
            disabled={isPhysiologistDisabled}
            style={isPhysiologistDisabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            <span className="rd" />
            <span>
              <span className="ct">Physiologist</span>
              <span className="cs">Co-manages group</span>
            </span>
          </button>
        </Tooltip>
      </div>

      <Input
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        iconLeft="Search"
        className="mb-3"
      />

      {selectedRole === 'patient' ? (
        <div className="row" style={{ marginBottom: 12, gap: 8, justifyContent: 'space-between' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleSelectAll}>
            Select all
          </button>
          <Checkbox
            checked={viewUnassigned}
            onChange={setViewUnassigned}
            label="View unassigned"
          />
        </div>
      ) : null}

      <div className="list-rows slim-scrollbar" style={{ maxHeight: 320, overflowY: 'auto' }}>
        {isLoading ? (
          <div className="row" style={{ justifyContent: 'center', gap: 8, padding: '24px 0' }}>
            <Icon name="LoaderCircle" size={18} className="animate-spin" />
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Loading…</span>
          </div>
        ) : filteredProfiles.length === 0 &&
          !(selectedRole === 'admin' && currentPhysiologistProfile && initialPhysiologistId) ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', padding: '12px 0' }}>
            No users found
          </p>
        ) : (
          <>
            {selectedRole === 'admin' &&
            currentPhysiologist &&
            currentPhysiologistProfile &&
            initialPhysiologistId ? (
              <MemberSelectRow
                key={currentPhysiologist.userId}
                profile={currentPhysiologistProfile}
                isSelected={selectedPhysiologistId === initialPhysiologistId}
                isCurrentMember={false}
                onToggle={() => {
                  if (isPhysiologistDisabled) return;
                  handleToggleUser(currentPhysiologist.userId, 'admin');
                }}
                disabled={isPhysiologistDisabled}
              />
            ) : null}
            {filteredProfiles.map((profile) => {
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
                <MemberSelectRow
                  key={profile.id}
                  profile={profile}
                  isSelected={isSelected}
                  isCurrentMember={initialMemberIds.has(profile.id)}
                  onToggle={() => {
                    if (selectedRole === 'admin' && isPhysiologistDisabled) return;
                    handleToggleUser(profile.id, selectedRole);
                  }}
                  disabled={selectedRole === 'admin' && isPhysiologistDisabled}
                />
              );
            })}
          </>
        )}
      </div>
    </HtmlModal>
  );
}
