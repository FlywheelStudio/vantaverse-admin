'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { useOrganizations } from '@/hooks/use-organizations';
import { OrganizationsTableProvider } from '@/context/organizations';
import { AddMembersModal } from '../add-members/add-members-modal';
import { OrganizationsTable } from './partials/organizations-table';
import { columns } from './partials/columns';
import { useGroupsState } from './hooks/use-groups-state';
import {
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useUploadOrganizationPicture,
} from './hooks/use-groups-mutations';
import {
  useGetTeamsByOrganizationId,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
} from '../teams/hooks/use-teams-mutations';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { Team } from '@/lib/supabase/schemas/teams';
import type {
  EditableField,
  EditableTeamField,
} from '@/context/organizations';

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.3,
    },
  },
};

interface GroupsUIProps {
  initialOrganizations?: Organization[];
}

export function GroupsUI({ initialOrganizations }: GroupsUIProps) {
  const { data: organizations, isLoading } = useOrganizations(initialOrganizations);
  const state = useGroupsState();

  // Mutations
  const createOrgMutation = useCreateOrganization();
  const updateOrgMutation = useUpdateOrganization();
  const deleteOrgMutation = useDeleteOrganization();
  const uploadImageMutation = useUploadOrganizationPicture();

  // Teams mutations
  const getTeamsMutation = useGetTeamsByOrganizationId();
  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();

  const handleSave = async (
    id: string,
    field: EditableField,
    value: string,
  ) => {
    if (!value.trim() && field === 'name') {
      state.setEditingCell(null);
      state.setEditingValue('');
      return;
    }

    if (id.startsWith('temp-')) {
      await createOrgMutation.mutateAsync({
        name: value.trim(),
        description: field === 'description' ? value.trim() || null : undefined,
      });
      state.setCreatingId(null);
      state.setEditingValue('');
    } else {
      const updateData: Partial<Organization> = {
        [field]: field === 'description' ? value.trim() || null : value.trim(),
      };

      await updateOrgMutation.mutateAsync({
        id,
        data: updateData,
      });

      state.setEditingCell(null);
      state.setEditingValue('');
    }
  };

  const handleCellBlur = (
    id: string,
    field: EditableField,
    value: string,
    originalValue: string | null,
  ) => {
    const normalizedNew = value.trim();
    const normalizedOriginal = originalValue?.trim() || '';

    if (normalizedNew !== normalizedOriginal) {
      handleSave(id, field, value);
    } else {
      state.setEditingCell(null);
      state.setEditingValue('');
    }
  };

  const handleImageUpload = async (file: File, orgId?: string) => {
    if (!orgId) return;

    state.setUploadingImage(orgId);

    try {
      const org = organizations?.find((o) => o.id === orgId);
      const oldPictureUrl = org?.picture_url || null;

      await uploadImageMutation.mutateAsync({
        organizationId: orgId,
        file,
        oldPictureUrl,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      state.setUploadingImage(null);
    }
  };

  const handleSaveNewOrg = async () => {
    if (!state.newOrgData.name.trim()) {
      return;
    }

    state.setSavingOrg(true);
    try {
      const org = await createOrgMutation.mutateAsync({
        name: state.newOrgData.name.trim(),
        description: state.newOrgData.description.trim() || null,
      });

      // Upload image if provided
      if (state.newOrgData.imageFile && org) {
        state.setUploadingImage(org.id);
        try {
          await uploadImageMutation.mutateAsync({
            organizationId: org.id,
            file: state.newOrgData.imageFile,
            oldPictureUrl: null,
          });
        } catch (error) {
          console.error('Error uploading image:', error);
        } finally {
          state.setUploadingImage(null);
        }
      }

      // Reset state
      state.setCreatingRow(false);
      state.setNewOrgData({
        name: '',
        description: '',
        imageFile: null,
        imagePreview: null,
      });
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      state.setSavingOrg(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteOrgMutation.mutateAsync(id);
  };

  // Teams handlers
  const handleExpandToggle = async (organizationId: string) => {
    if (state.expandedOrganizationId === organizationId) {
      state.setExpandedOrganizationId(null);
    } else {
      state.setExpandedOrganizationId(organizationId);
      // Fetch teams for this organization
      const org = organizations?.find((o) => o.id === organizationId);
      if (org && !org.teams) {
        await getTeamsMutation.mutateAsync(organizationId);
      }
    }
  };

  const handleTeamBlur = async (
    id: string,
    field: EditableTeamField,
    value: string,
    originalValue: string | null,
  ) => {
    const normalizedNew = value.trim();
    const normalizedOriginal = originalValue?.trim() || '';

    if (normalizedNew !== normalizedOriginal) {
      const updateData: Partial<Pick<Team, 'name' | 'description'>> = {
        [field]:
          field === 'description' ? normalizedNew || null : normalizedNew,
      };

      await updateTeamMutation.mutateAsync({
        id,
        data: updateData,
      });

      state.setEditingTeam(null);
      state.setEditingTeamValue('');
    } else {
      state.setEditingTeam(null);
      state.setEditingTeamValue('');
    }
  };

  const handleSaveNewTeam = async (organizationId: string) => {
    if (!state.newTeamData.name.trim()) {
      return;
    }

    state.setSavingTeam(true);
    try {
      await createTeamMutation.mutateAsync({
        organizationId,
        name: state.newTeamData.name.trim(),
        description: state.newTeamData.description.trim() || null,
      });

      // Reset state
      state.setCreatingTeam(false);
      state.setNewTeamData({
        organizationId: '',
        name: '',
        description: '',
      });
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      state.setSavingTeam(false);
    }
  };

  const handleTeamDelete = async (teamId: string) => {
    await deleteTeamMutation.mutateAsync(teamId);
  };

  const displayOrganizations = organizations || [];

  const contextValue = {
    handleCreate: state.handleCreate,
    handleSave,
    handleCancel: state.handleCancel,
    handleCellEdit: (id: string, field: EditableField) =>
      state.handleCellEdit(organizations, id, field),
    handleCellBlur,
    creatingId: state.creatingId,
    creatingRow: state.creatingRow,
    editingCell: state.editingCell,
    editingValue: state.editingValue,
    setEditingValue: state.setEditingValue,
    inputRef: state.inputRef,
    newOrgData: state.newOrgData,
    setNewOrgData: state.setNewOrgData,
    uploadingImage: state.uploadingImage,
    setUploadingImage: state.setUploadingImage,
    savingOrg: state.savingOrg,
    handleImageUpload,
    handleSaveNewOrg,
    handleCancelNewOrg: state.handleCancelNewOrg,
    handleDelete,
    // Teams
    expandedOrganizationId: state.expandedOrganizationId,
    handleExpandToggle,
    editingTeam: state.editingTeam,
    editingTeamValue: state.editingTeamValue,
    setEditingTeamValue: state.setEditingTeamValue,
    handleTeamEdit: (id: string, field: EditableTeamField) => {
      state.handleTeamEdit(organizations, id, field);
    },
    handleTeamBlur,
    handleTeamCancel: state.handleTeamCancel,
    handleTeamCreate: state.handleTeamCreate,
    handleTeamDelete,
    creatingTeam: state.creatingTeam,
    savingTeam: state.savingTeam,
    newTeamData: state.newTeamData,
    setNewTeamData: state.setNewTeamData,
    handleSaveNewTeam,
    handleCancelNewTeam: state.handleCancelNewTeam,
    addingMembersTo: state.addingMembersTo,
    rowZIndex: state.rowZIndex,
    handleOpenAddMembers: state.handleOpenAddMembers,
    handleCloseAddMembers: state.handleCloseAddMembers,
    setRowZIndex: state.setRowZIndex,
  };

  return (
    <OrganizationsTableProvider value={contextValue}>
      {!isLoading && (
        <Card
          className={`text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden ${
            !state.addingMembersTo ? 'backdrop-blur-sm' : ''
          }`}
        >
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key="table"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <OrganizationsTable
                  columns={columns}
                  data={displayOrganizations}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      )}
      {state.addingMembersTo &&
        (() => {
          const addingMembersTo = state.addingMembersTo;
          if (!addingMembersTo) return null;
          const targetOrg =
            addingMembersTo.type === 'organization'
              ? displayOrganizations.find((o) => o.id === addingMembersTo.id)
              : undefined;
          const targetTeam =
            addingMembersTo.type === 'team'
              ? displayOrganizations
                  .flatMap((o) => o.teams || [])
                  .find((t) => t.id === addingMembersTo.id)
              : undefined;

          if (
            (addingMembersTo.type === 'organization' && !targetOrg) ||
            (addingMembersTo.type === 'team' && !targetTeam)
          ) {
            return null;
          }

          const targetOrganizationName =
            addingMembersTo.type === 'team' && targetTeam?.organization_id
              ? displayOrganizations.find(
                  (o) => o.id === targetTeam.organization_id,
                )?.name
              : undefined;

          return (
            <AddMembersModal
              open={!!addingMembersTo}
              onOpenChange={(open) => {
                if (!open) state.handleCloseAddMembers();
              }}
              type={addingMembersTo.type}
              id={addingMembersTo.id}
              name={
                addingMembersTo.type === 'organization'
                  ? targetOrg?.name || ''
                  : targetTeam?.name || ''
              }
              organizationId={
                addingMembersTo.type === 'team'
                  ? targetTeam?.organization_id
                  : undefined
              }
              organizationName={targetOrganizationName}
            />
          );
        })()}
    </OrganizationsTableProvider>
  );
}
