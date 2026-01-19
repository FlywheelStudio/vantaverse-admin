'use client';

import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/page-wrapper';
import { Card } from '@/components/ui/card';
import { AddMembersModal } from '../add-members/add-members-modal';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { getCurrentPhysiologist } from '../actions';
import {
  getOrganizationMembersWithPrograms,
  removeMemberFromOrganization,
  type GroupMemberWithProgram,
} from './actions';
import { GroupDetailsSubheader } from './subheader';
import { PhysicianCard, type PhysicianInfo } from './physician-card';
import { OrganizationInfoCard } from './organization-info-card';
import { MembersTable } from './members-table';
import type { GroupMemberRow } from './members-table/columns';

export function GroupDetailsPageUI({
  organization,
  physician,
  initialMembers,
}: {
  organization: Organization;
  physician: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    description: string | null;
  } | null;
  initialMembers: GroupMemberWithProgram[];
}) {
  const [org, setOrg] = useState<
    Pick<Organization, 'id' | 'name' | 'description' | 'picture_url'>
  >({
    id: organization.id,
    name: organization.name,
    description: organization.description,
    picture_url: organization.picture_url,
  });

  const [members, setMembers] =
    useState<GroupMemberWithProgram[]>(initialMembers);

  const [currentPhysician, setCurrentPhysician] =
    useState<PhysicianInfo | null>(physician);

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersModalRole, setMembersModalRole] =
    useState<MemberRole>('patient');

  const memberRows: GroupMemberRow[] = useMemo(
    () =>
      members.map((m) => ({
        user_id: m.user_id,
        first_name: m.first_name,
        last_name: m.last_name,
        email: m.email,
        avatar_url: m.avatar_url,
        program_name: m.program_name,
      })),
    [members],
  );

  const refresh = useCallback(async () => {
    const [membersResult, physicianResult] = await Promise.all([
      getOrganizationMembersWithPrograms(org.id),
      getCurrentPhysiologist(org.id),
    ]);

    if (membersResult.success) setMembers(membersResult.data);
    if (physicianResult.success) setCurrentPhysician(physicianResult.data);
  }, [org.id]);

  const openAddUsers = () => {
    setMembersModalRole('patient');
    setMembersModalOpen(true);
  };

  const openAssignPhysician = () => {
    setMembersModalRole('admin');
    setMembersModalOpen(true);
  };

  const handleRemove = async (userId: string) => {
    const result = await removeMemberFromOrganization(org.id, userId);
    if (!result.success) {
      toast.error(result.error || 'Failed to remove member');
      return;
    }
    toast.success('Member removed');
    await refresh();
  };

  return (
    <PageWrapper
      subheader={
        <GroupDetailsSubheader
          organization={org}
          onOrganizationChange={(patch) =>
            setOrg((prev) => ({ ...prev, ...patch }))
          }
        />
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
            <PhysicianCard
              physician={currentPhysician}
              onAssignClick={openAssignPhysician}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full"
          >
            <OrganizationInfoCard
              organization={org}
              memberCount={members.length}
              onOrganizationChange={(patch) =>
                setOrg((prev) => ({ ...prev, ...patch }))
              }
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              <MembersTable
                data={memberRows}
                onAddClick={openAddUsers}
                onRemove={handleRemove}
                organizationId={org.id}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      <AddMembersModal
        open={membersModalOpen}
        onOpenChange={async (open) => {
          setMembersModalOpen(open);
          if (!open) await refresh();
        }}
        type="organization"
        id={org.id}
        name={org.name}
        initialRole={membersModalRole}
      />
    </PageWrapper>
  );
}
