'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { Card } from '@/components/ui/card';
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
import { GroupDetailsSubheader } from './partials/subheader';
import { PhysicianCard } from './partials/physician-card';
import { OrganizationInfoCard } from './partials/organization-info-card';
import { MembersTable } from './partials/members-table';
import type { GroupMemberRow } from './partials/members-table-columns';
import type { GroupMemberWithProgram, SuperAdminGroupUser } from './actions';

export function GroupDetailsPageUI({
  organization,
  physician,
  initialMembers,
}: {
  organization: Organization;
  physician: PhysicianInfo | null;
  initialMembers: Array<GroupMemberWithProgram | SuperAdminGroupUser>;
}) {
  // Use React Query hooks instead of useState
  const { data: org } = useOrganization(organization.id, organization);

  // Ensure initialMembers is always an array
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
  const { data: currentPhysician } = useGroupPhysiologist(
    isSuperAdminOrg ? null : organization.id,
    physician,
  );

  const members = useMemo(() => {
    // Ensure result is always an array, even if membersData is null, undefined, or not an array
    const data = isSuperAdminOrg ? superAdminUsersData : membersData;
    return Array.isArray(data) ? data : [];
  }, [isSuperAdminOrg, membersData, superAdminUsersData]);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersModalRole, setMembersModalRole] =
    useState<MemberRole>('patient');
  const [inviteUsersModalOpen, setInviteUsersModalOpen] = useState(false);

  // Remove member mutation
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

  const openAddUsers = () => {
    if (isSuperAdminOrg) {
      setInviteUsersModalOpen(true);
      return;
    }
    setMembersModalRole('patient');
    setMembersModalOpen(true);
  };

  const openAssignPhysician = () => {
    setMembersModalRole('admin');
    setMembersModalOpen(true);
  };

  if (!org) {
    return null;
  }

  return (
    <PageWrapper
      subheader={
        <GroupDetailsSubheader organization={org} />
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0 }}
            className="h-full"
          >
            {isSuperAdminOrg ? (
              <Card className="p-6 border-2 border-blue-200 bg-blue-50 h-full flex items-center">
                <div className="text-sm font-medium text-blue-900">
                  This organization is only for administrators & physicians
                </div>
              </Card>
            ) : (
              <PhysicianCard
                physician={currentPhysician ?? null}
                onAssignClick={openAssignPhysician}
                organizationId={org.id}
              />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full"
          >
            <OrganizationInfoCard
              organization={org}
              memberCount={Array.isArray(members) ? members.length : 0}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="text-card-foreground flex flex-col gap-6 bg-card/95 rounded-3xl border-2 border-border shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              <MembersTable
                data={memberRows}
                onAddClick={openAddUsers}
                removeMemberMutation={removeMemberMutation}
                addAdminMutation={addAdminMutation}
                removeAdminMutation={removeAdminMutation}
                isSuperAdminOrg={isSuperAdminOrg}
                organizationId={org.id}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      {!isSuperAdminOrg && (
        <AddMembersModal
          open={membersModalOpen}
          onOpenChange={setMembersModalOpen}
          type="organization"
          id={org.id}
          name={org.name}
          initialRole={membersModalRole}
        />
      )}

      {isSuperAdminOrg && (
        <AddUserModal
          open={inviteUsersModalOpen}
          onOpenChange={setInviteUsersModalOpen}
          role="admin"
        />
      )}
    </PageWrapper>
  );
}
