'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { PageWrapper } from '@/components/page-wrapper';
import { Card } from '@/components/ui/card';
import { AddMembersModal } from '../add-members/add-members-modal';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { useOrganization } from '@/hooks/use-organizations';
import {
  useGroupMembers,
  useGroupPhysiologist,
  type PhysicianInfo,
} from './hooks/use-groups';
import { useRemoveGroupMember } from './hooks/use-group-mutations';
import { GroupDetailsSubheader } from './partials/subheader';
import { PhysicianCard } from './partials/physician-card';
import { OrganizationInfoCard } from './partials/organization-info-card';
import { MembersTable } from './partials/members-table';
import type { GroupMemberRow } from './partials/members-table-columns';
import type { GroupMemberWithProgram } from './actions';

export function GroupDetailsPageUI({
  organization,
  physician,
  initialMembers,
}: {
  organization: Organization;
  physician: PhysicianInfo | null;
  initialMembers: GroupMemberWithProgram[];
}) {
  const queryClient = useQueryClient();

  // Use React Query hooks instead of useState
  const { data: org } = useOrganization(organization.id, organization);
  const { data: members = [] } = useGroupMembers(
    organization.id,
    initialMembers,
  );
  const { data: currentPhysician } = useGroupPhysiologist(
    organization.id,
    physician,
  );

  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersModalRole, setMembersModalRole] =
    useState<MemberRole>('patient');

  // Remove member mutation
  const removeMemberMutation = useRemoveGroupMember(organization.id);

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

  const openAddUsers = () => {
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
            <PhysicianCard
              physician={currentPhysician}
              onAssignClick={openAssignPhysician}
              organizationId={org.id}
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
                removeMemberMutation={removeMemberMutation}
                organizationId={org.id}
              />
            </div>
          </Card>
        </motion.div>
      </div>

      <AddMembersModal
        open={membersModalOpen}
        onOpenChange={(open) => {
          setMembersModalOpen(open);
          if (!open) {
            // Invalidate queries to refresh data after modal closes
            queryClient.invalidateQueries({
              queryKey: ['groups', 'detail', org.id],
            });
          }
        }}
        type="organization"
        id={org.id}
        name={org.name}
        initialRole={membersModalRole}
      />
    </PageWrapper>
  );
}
