'use client';

import { useState, useMemo } from 'react';
import {
  Avatar,
  Icon,
  Switch,
  Tooltip,
} from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { cn } from '@/lib/utils';
import { useMemberData } from './hooks/use-member-data';
import { useMemberSelection } from './hooks/use-member-selection';
import { useSaveMembers } from './hooks/use-save-members';
import { filterProfiles } from './utils/filter-profiles';
import {
  createPendingInviteRow,
  type PendingInviteRow,
} from './add-members-mock-data';
import type { AddMembersModalProps } from './types';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';
import type { AdminProfile } from '@/lib/supabase/schemas/admins';

interface SelectableMember {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  orgMemberships?: Array<{
    orgId: string;
    orgName: string;
    role?: MemberRole;
  }>;
  teamMemberships?: Array<{
    teamId: string;
    teamName: string;
    orgId: string;
    orgName: string;
  }>;
}

const toSelectableAdmin = (admin: AdminProfile): SelectableMember => ({
  id: admin.id,
  first_name: admin.first_name,
  last_name: admin.last_name,
  email: admin.email,
  avatar_url: admin.avatar_url,
  orgMemberships: (admin.orgMemberships ?? []).map((om) => ({
    orgId: om.orgId,
    orgName: om.orgName,
    role: 'admin' as const,
  })),
});

interface MemberSelectRowProps {
  profile: SelectableMember;
  isSelected: boolean;
  isCurrentMember: boolean;
  groupLabel: string | null;
  onToggle: () => void;
  disabled?: boolean;
}

function getProfileGroupLabel(
  profile: SelectableMember,
  type: 'organization' | 'team',
  currentId: string,
): string | null {
  if (type === 'team') {
    const current = (profile.teamMemberships ?? []).find(
      (tm) => tm.teamId === currentId,
    );
    if (current) return current.teamName;
    const other = (profile.teamMemberships ?? [])[0];
    if (other) return other.teamName;
    const org = (profile.orgMemberships ?? [])[0];
    return org?.orgName ?? null;
  }

  const currentOrg = (profile.orgMemberships ?? []).find(
    (om) => om.orgId === currentId,
  );
  if (currentOrg) return currentOrg.orgName;
  const otherOrg = (profile.orgMemberships ?? [])[0];
  if (otherOrg) return otherOrg.orgName;
  const team = (profile.teamMemberships ?? [])[0];
  return team?.teamName ?? null;
}

/**
 * Returns another-group name when the profile belongs elsewhere (move warning).
 */
function getConflictGroupName(
  profile: SelectableMember,
  type: 'organization' | 'team',
  currentId: string,
): string | null {
  if (type === 'team') {
    const otherTeam = (profile.teamMemberships ?? []).find(
      (tm) => tm.teamId !== currentId,
    );
    return otherTeam?.teamName ?? null;
  }

  const otherOrg = (profile.orgMemberships ?? []).find(
    (om) => om.orgId !== currentId,
  );
  if (otherOrg) return otherOrg.orgName;

  const otherTeam = (profile.teamMemberships ?? []).find(
    (tm) => tm.orgId !== currentId,
  );
  return otherTeam?.teamName ?? otherTeam?.orgName ?? null;
}

function MemberSelectRow({
  profile,
  isSelected,
  isCurrentMember,
  groupLabel,
  onToggle,
  disabled,
}: MemberSelectRowProps): React.ReactElement {
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    profile.email ||
    'Unknown';

  const badgeLabel = isCurrentMember
    ? 'Member'
    : groupLabel
      ? groupLabel
      : 'No group';
  const isNoGroup = !isCurrentMember && !groupLabel;

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
      <span className={cn('bdg', isNoGroup && 'bdg-o')}>{badgeLabel}</span>
    </button>
  );
}

function filterPatients(
  profiles: ProfileWithMemberships[],
): ProfileWithMemberships[] {
  return profiles.filter((profile) => {
    const hasAdminRole = (profile.orgMemberships ?? []).some(
      (om) => om.role === 'admin',
    );
    return !hasAdminRole;
  });
}

export function AddMembersModal({
  open,
  onOpenChange,
  type,
  id,
  name,
  organizationId,
  initialRole,
}: AddMembersModalProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<MemberRole>(
    initialRole ?? 'patient',
  );

  // Track the last intent seen. Callers set initialRole per invocation
  // (e.g. 'admin' to assign a physiologist); when it changes we adjust
  // the role during render — before commit, so no stale frame shows.
  const [lastIntent, setLastIntent] = useState<MemberRole | undefined>(
    initialRole,
  );
  if (initialRole !== lastIntent) {
    setLastIntent(initialRole);
    setSelectedRole(initialRole ?? 'patient');
  }

  const [viewUnassigned, setViewUnassigned] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [pendingInvites, setPendingInvites] = useState<PendingInviteRow[]>([]);
  const [inviteAlert, setInviteAlert] = useState<string | null>(null);

  const {
    profilesData,
    profilesLoading,
    membersLoading,
    initialMemberIds,
    initialPhysiologistId,
    currentPhysiologist,
    adminProfiles,
  } = useMemberData(open, type, id, organizationId);

  const {
    selectedMemberIds,
    selectedPhysiologistId,
    handleToggleUser,
    handleToggleGroup,
    hasChanges,
    resetSelection,
  } = useMemberSelection({
    initialMemberIds,
    initialPhysiologistId,
  });

  const resetModalState = (): void => {
    resetSelection();
    setSearchQuery('');
    setViewUnassigned(true);
    setSelectedRole(initialRole ?? 'patient');
    setInviteEmail('');
    setPendingInvites([]);
    setInviteAlert(null);
  };

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
    onSuccess: () => {
      resetModalState();
      onOpenChange(false);
    },
  });

  const allProfiles = useMemo((): ProfileWithMemberships[] => {
    if (!profilesData?.success || !profilesData.data) return [];
    return profilesData.data;
  }, [profilesData]);

  const selectableAdmins = useMemo(
    () => adminProfiles.map(toSelectableAdmin),
    [adminProfiles],
  );

  const roleFilteredProfiles = useMemo(
    (): SelectableMember[] =>
      selectedRole === 'admin'
        ? selectableAdmins
        : filterPatients(allProfiles),
    [allProfiles, selectableAdmins, selectedRole],
  );

  const filteredProfiles = useMemo(() => {
    let filtered = filterProfiles(roleFilteredProfiles, searchQuery);

    if (selectedRole === 'patient' && viewUnassigned) {
      filtered = filtered.filter(
        (profile) =>
          (profile.orgMemberships?.length ?? 0) === 0 &&
          (profile.teamMemberships?.length ?? 0) === 0,
      );
    }

    return filtered;
  }, [roleFilteredProfiles, selectedRole, searchQuery, viewUnassigned]);

  const allUserIds = useMemo(
    () => filteredProfiles.map((p) => p.id),
    [filteredProfiles],
  );

  const currentPhysiologistProfile = useMemo(() => {
    if (selectedRole !== 'admin' || !currentPhysiologist) return null;
    return selectableAdmins.find((p) => p.id === currentPhysiologist.userId) ?? null;
  }, [selectedRole, currentPhysiologist, selectableAdmins]);

  const selectedCount =
    selectedRole === 'patient'
      ? selectedMemberIds.size
      : selectedPhysiologistId
        ? 1
        : 0;

  let moveWarning: { personName: string; groupName: string } | null = null;
  if (selectedRole === 'patient') {
    for (const profile of allProfiles) {
      if (!selectedMemberIds.has(profile.id)) continue;
      if (initialMemberIds.has(profile.id)) continue;

      const conflictGroup = getConflictGroupName(profile, type, id);
      if (!conflictGroup) continue;

      const personName =
        [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
        profile.email ||
        'This member';

      moveWarning = { personName, groupName: conflictGroup };
      break;
    }
  }

  const handleSelectAll = (): void => {
    if (selectedRole === 'patient') {
      handleToggleGroup(allUserIds, 'patient');
    }
  };

  const handleInviteByEmail = (): void => {
    const trimmed = inviteEmail.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setInviteAlert('Enter a valid email address to invite.');
      return;
    }

    const alreadyPending = pendingInvites.some(
      (row) => row.email.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyPending) {
      setInviteAlert(`${trimmed} is already on the invite list.`);
      return;
    }

    setPendingInvites((prev) => [...prev, createPendingInviteRow(trimmed)]);
    setInviteEmail('');
    setInviteAlert(`Invite queued for ${trimmed} (mock — no email sent).`);
  };

  const handleCancel = (): void => {
    resetModalState();
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

  // Physiologist-assignment invocations lock the modal to the admin role.
  const isPhysiologistIntent = initialRole === 'admin';
  const isMemberRole = selectedRole === 'patient';
  const isPhysiologistRole = selectedRole === 'admin';

  const inviteTitle = isPhysiologistRole
    ? `Assign physiologist to ${name}`
    : `Add members to ${name}`;

  const inviteSubtitle = isPhysiologistRole
    ? 'Only admins can be assigned as the group physiologist.'
    : "They inherit the group's physiologist and can be assigned its programs.";

  const saveLabel =
    isPending || membersLoading
      ? 'Saving...'
      : selectedRole === 'patient'
        ? `Add ${selectedCount} member${selectedCount !== 1 ? 's' : ''}`
        : hasPhysiologistSelected &&
            currentPhysiologistName &&
            selectedPhysiologistId !== initialPhysiologistId
          ? 'Replace physiologist'
          : 'Assign physiologist';

  return (
    <HtmlModal
      open={open}
      title={inviteTitle}
      subtitle={inviteSubtitle}
      onClose={handleCancel}
      width={620}
      footerInfo={`${selectedCount} selected`}
      footer={
        <>
          <button
            type="button"
            className="btn btn-sec"
            onClick={handleCancel}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-acc"
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
      {!isPhysiologistIntent ? (
        <>
          <label className="lbl" style={{ marginBottom: 9 }}>
            Add them as
          </label>
          <div className="g g2" style={{ gap: 11, marginBottom: 18 }}>
            <button
              type="button"
              className={cn('choice', isMemberRole && 'on')}
              onClick={() => setSelectedRole('patient')}
            >
              <span className={cn('rd', isMemberRole && 'on')}>
                {isMemberRole ? <i /> : null}
              </span>
              <span>
                <span className="ct">Member</span>
                <span className="cd">
                  Follows a program, appears in completion metrics.
                </span>
              </span>
            </button>

            <Tooltip
              label={
                isPhysiologistDisabled
                  ? 'Physiologist is managed at organization level and applies to all teams in the organization'
                  : 'Co-manages the group and can edit programs.'
              }
            >
              <button
                type="button"
                className={cn('choice', isPhysiologistRole && 'on')}
                onClick={() => !isPhysiologistDisabled && setSelectedRole('admin')}
                disabled={isPhysiologistDisabled}
                style={
                  isPhysiologistDisabled
                    ? { opacity: 0.6, cursor: 'not-allowed' }
                    : undefined
                }
              >
                <span className={cn('rd', isPhysiologistRole && 'on')}>
                  {isPhysiologistRole ? <i /> : null}
                </span>
                <span>
                  <span className="ct">Physiologist</span>
                  <span className="cd">
                    Co-manages the group and can edit programs.
                  </span>
                </span>
              </button>
            </Tooltip>
          </div>
        </>
      ) : null}

      {!isPhysiologistRole ? (
        <>
      <div className="ff" style={{ marginBottom: 12 }}>
        <label className="lbl" htmlFor="add-members-invite-email">
          Invite by email
        </label>
        <div className="row" style={{ gap: 9 }}>
          <div className="fld" style={{ flex: 1 }}>
            <Icon name="Mail" size={16} />
            <input
              id="add-members-invite-email"
              type="email"
              placeholder="name@example.com"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                if (inviteAlert) setInviteAlert(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInviteByEmail();
                }
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-sec"
            onClick={handleInviteByEmail}
          >
            Invite
          </button>
        </div>
      </div>

      {inviteAlert ? (
        <div className="alert alert-i" style={{ marginBottom: 12 }}>
          <Icon name="Info" size={18} />
          <div>{inviteAlert}</div>
        </div>
      ) : null}

      {pendingInvites.length > 0 ? (
        <div className="list-rows" style={{ marginBottom: 12 }}>
          {pendingInvites.map((row) => (
            <div key={row.id} className="lrow">
              <span className="cb" />
              <Avatar name={row.email} size="sm" />
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span className="nm">{row.email}</span>
                <span className="em">Pending invite</span>
              </span>
              <span className="bdg bdg-o">Invited</span>
            </div>
          ))}
        </div>
      ) : null}
        </>
      ) : null}

      <div className="row" style={{ gap: 9, marginBottom: 12 }}>
        <div className="fld" style={{ flex: 1 }}>
          <Icon name="Search" size={16} />
          <input
            id="add-members-search"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {selectedRole === 'patient' ? (
          <Switch
            style={{ margin: 0, flexShrink: 0, whiteSpace: 'nowrap' }}
            checked={viewUnassigned}
            onChange={setViewUnassigned}
            label="Only people with no group"
          />
        ) : null}
      </div>

      {selectedRole === 'patient' ? (
        <div
          className="row"
          style={{
            marginBottom: 8,
            gap: 8,
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            className="lnk"
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
            onClick={handleSelectAll}
          >
            Select all {filteredProfiles.length}
          </button>
          <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
            Showing {filteredProfiles.length} of {roleFilteredProfiles.length}{' '}
            {viewUnassigned ? 'unassigned members' : 'members'}
          </span>
        </div>
      ) : null}

      <div
        className="list-rows slim-scrollbar"
        style={{ maxHeight: 320, overflowY: 'auto' }}
      >
        {isLoading ? (
          <div
            className="row"
            style={{ justifyContent: 'center', gap: 8, padding: '24px 0' }}
          >
            <Icon name="LoaderCircle" size={18} className="animate-spin" />
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-muted)',
              }}
            >
              Loading…
            </span>
          </div>
        ) : filteredProfiles.length === 0 &&
          !(
            selectedRole === 'admin' &&
            currentPhysiologistProfile &&
            initialPhysiologistId
          ) ? (
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              padding: '12px 0',
            }}
          >
            {selectedRole === 'admin' ? 'No admins found' : 'No users found'}
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
                groupLabel={getProfileGroupLabel(
                  currentPhysiologistProfile,
                  type,
                  id,
                )}
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
                  groupLabel={getProfileGroupLabel(profile, type, id)}
                  onToggle={() => {
                    if (selectedRole === 'admin' && isPhysiologistDisabled)
                      return;
                    handleToggleUser(profile.id, selectedRole);
                  }}
                  disabled={selectedRole === 'admin' && isPhysiologistDisabled}
                />
              );
            })}
          </>
        )}
      </div>

      {moveWarning ? (
        <div className="alert alert-i" style={{ marginTop: 16 }}>
          <Icon name="Info" size={18} />
          <div>
            {moveWarning.personName} is already in{' '}
            <b>{moveWarning.groupName}</b>. Adding them here moves them — a
            member belongs to one group at a time.
          </div>
        </div>
      ) : null}
    </HtmlModal>
  );
}
