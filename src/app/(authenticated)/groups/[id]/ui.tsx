'use client';

import { useMemo, useState } from 'react';
import { AppBar } from '@/components/medvanta/shell';
import { Icon } from '@/components/medvanta';
import { AddMembersModal } from '../add-members/add-members-modal';
import { AddUserModal } from '@/app/(authenticated)/users/users-table/components/add-user-modal';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useOrganization } from '@/hooks/use-organizations';
import {
  useGroupMembers,
  useGroupPhysiologist,
  useSuperAdminGroupUsers,
  type PhysicianInfo,
} from './hooks/use-groups';
import {
  useAddGroupAdmin,
  useRemoveGroupAdmin,
  useRemoveGroupMember,
} from './hooks/use-group-mutations';
import { GroupHeroCard } from './partials/group-hero-card';
import { GroupProgramsPanel } from './partials/group-programs-panel';
import { useGroupPrograms } from './hooks/use-group-programs';
import { GroupSettingsPanel } from './partials/group-settings-panel';
import { MembersTable } from './partials/members-table';
import type { GroupMemberRow } from './partials/members-table-columns';
import type {
  GroupMemberWithProgram,
  GroupProgramRowData,
  SuperAdminGroupUser,
} from './actions';

type GroupDetailTab = 'members' | 'programs' | 'settings';

export function GroupDetailsPageUI({
  organization,
  physician,
  initialMembers,
  initialPrograms,
}: {
  organization: Organization;
  physician: PhysicianInfo | null;
  initialMembers: Array<GroupMemberWithProgram | SuperAdminGroupUser>;
  initialPrograms: GroupProgramRowData[];
}): React.ReactElement | null {
  const { data: org } = useOrganization(organization.id, organization);
  const [activeTab, setActiveTab] = useState<GroupDetailTab>('members');

  const safeInitialMembers = useMemo(
    () => (Array.isArray(initialMembers) ? initialMembers : []),
    [initialMembers],
  );
  const isSuperAdminOrg = organization.is_super_admin === true;

  const initialPatients = useMemo(
    () =>
      safeInitialMembers.filter(
        (m): m is GroupMemberWithProgram =>
          typeof m === 'object' && m !== null && 'program_name' in m,
      ),
    [safeInitialMembers],
  );

  const initialSuperAdminUsers = useMemo(
    () =>
      safeInitialMembers.filter(
        (m): m is SuperAdminGroupUser =>
          typeof m === 'object' && m !== null && 'role' in m,
      ),
    [safeInitialMembers],
  );

  const { data: membersData } = useGroupMembers(
    isSuperAdminOrg ? null : organization.id,
    initialPatients,
  );
  const { data: superAdminUsersData } = useSuperAdminGroupUsers(
    isSuperAdminOrg ? organization.id : null,
    initialSuperAdminUsers,
  );
  const { data: groupPrograms = [], isLoading: programsLoading } = useGroupPrograms(
    isSuperAdminOrg ? null : organization.id,
    isSuperAdminOrg ? undefined : initialPrograms,
  );
  const { data: currentPhysician } = useGroupPhysiologist(
    isSuperAdminOrg ? null : organization.id,
    physician,
  );

  const members = useMemo(() => {
    const data = isSuperAdminOrg ? superAdminUsersData : membersData;
    return Array.isArray(data) ? data : [];
  }, [isSuperAdminOrg, membersData, superAdminUsersData]);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersModalRole, setMembersModalRole] = useState<MemberRole>('patient');
  const [inviteUsersModalOpen, setInviteUsersModalOpen] = useState(false);

  const removeMemberMutation = useRemoveGroupMember(organization.id);
  const addAdminMutation = useAddGroupAdmin(organization.id);
  const removeAdminMutation = useRemoveGroupAdmin(organization.id);

  const memberRows: GroupMemberRow[] = useMemo(
    () =>
      members
        .filter((m) => m && typeof m === 'object' && m.user_id)
        .map((m) => ({
          user_id: m.user_id,
          first_name: m.first_name,
          last_name: m.last_name,
          email: m.email,
          avatar_url: m.avatar_url,
          program_name:
            typeof m === 'object' && m !== null && 'program_name' in m
              ? m.program_name
              : null,
          role:
            typeof m === 'object' && m !== null && 'role' in m ? m.role : null,
        })),
    [members],
  );


  const openAddUsers = (): void => {
    if (isSuperAdminOrg) {
      setInviteUsersModalOpen(true);
      return;
    }
    setMembersModalRole('patient');
    setMembersModalOpen(true);
  };

  const openAssignPhysician = (): void => {
    setMembersModalRole('admin');
    setMembersModalOpen(true);
  };

  if (!org) {
    return null;
  }

  return (
    <>
      <AppBar
        crumbs={[
          { label: 'Groups', href: '/groups' },
          { label: org.name },
        ]}
        title={org.name}
      />
      <div className="body">
        {isSuperAdminOrg ? (
          <div className="alert alert-i" style={{ marginBottom: 16 }}>
            <Icon name="Info" size={20} />
            <div>
              <div className="at">Administrator organization</div>
              This organization is only for administrators and physicians.
            </div>
          </div>
        ) : (
          <GroupHeroCard
            organization={org}
            physician={currentPhysician ?? null}
            onAddMembers={openAddUsers}
            onAssignPhysician={openAssignPhysician}
          />
        )}

        <div className="tabs" style={{ marginBottom: 18 }}>
          <button
            type="button"
            className={activeTab === 'members' ? 'on' : undefined}
            onClick={() => setActiveTab('members')}
          >
            <Icon name="UsersRound" size={16} />
            Members
            <span className="cnt">{members.length}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'programs' ? 'on' : undefined}
            onClick={() => setActiveTab('programs')}
          >
            <Icon name="ClipboardList" size={16} />
            Programs
            <span className="cnt">{groupPrograms.length}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'settings' ? 'on' : undefined}
            onClick={() => setActiveTab('settings')}
          >
            <Icon name="SlidersHorizontal" size={16} />
            Settings
          </button>
        </div>

        {activeTab === 'members' ? (
          <MembersTable
            data={memberRows}
            removeMemberMutation={removeMemberMutation}
            addAdminMutation={addAdminMutation}
            removeAdminMutation={removeAdminMutation}
            isSuperAdminOrg={isSuperAdminOrg}
            organizationId={org.id}
          />
        ) : null}
        {activeTab === 'programs' ? (
          <GroupProgramsPanel
            organizationId={org.id}
            groupName={org.name}
            members={memberRows}
            programs={groupPrograms}
            isLoading={programsLoading}
          />
        ) : null}
        {activeTab === 'settings' ? (
          <GroupSettingsPanel
            groupName={org.name}
            organizationId={org.id}
            initialScreeningUrl={org.screening_url ?? null}
            initialDescription={org.description ?? null}
            pictureUrl={org.picture_url}
          />
        ) : null}
      </div>

      {!isSuperAdminOrg ? (
        <AddMembersModal
          open={membersModalOpen}
          onOpenChange={setMembersModalOpen}
          type="organization"
          id={org.id}
          name={org.name}
          initialRole={membersModalRole}
        />
      ) : null}

      {isSuperAdminOrg ? (
        <AddUserModal
          open={inviteUsersModalOpen}
          onOpenChange={setInviteUsersModalOpen}
          role="admin"
        />
      ) : null}
    </>
  );
}
