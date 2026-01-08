'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { PageWrapper } from '@/components/page-wrapper';
import { useOrganizations } from '@/hooks/use-organizations';
import {
  createOrganization,
  updateOrganization,
  uploadOrganizationPicture,
  updateOrganizationPicture,
  deleteOrganization,
} from './actions';
import {
  getTeamsByOrganizationId,
  createTeam,
  updateTeam,
  deleteTeam,
} from './teams-actions';
import { useQueryClient } from '@tanstack/react-query';
import { OrganizationsTable } from './organizations-table';
import { columns } from './columns';
import { Card } from '@/components/ui/card';
import { OrganizationsTableProvider } from '../../../context/organizations';
import { AddMembersModal } from './add-members/add-members-modal';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type {
  EditableField,
  EditableTeamField,
} from '../../../context/organizations';
import type { Team } from '@/lib/supabase/schemas/teams';

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

export default function OrganizationsPage() {
  const { data: organizations, isLoading } = useOrganizations();
  const queryClient = useQueryClient();
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [creatingRow, setCreatingRow] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: EditableField;
  } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);
  const [newOrgData, setNewOrgData] = useState<{
    name: string;
    description: string;
    imageFile: File | null;
    imagePreview: string | null;
  }>({
    name: '',
    description: '',
    imageFile: null,
    imagePreview: null,
  });
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Teams state
  const [expandedOrganizationId, setExpandedOrganizationId] = useState<
    string | null
  >(null);
  const [editingTeam, setEditingTeam] = useState<{
    id: string;
    field: EditableTeamField;
  } | null>(null);
  const [editingTeamValue, setEditingTeamValue] = useState<string>('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [newTeamData, setNewTeamData] = useState<{
    organizationId: string;
    name: string;
    description: string;
  }>({
    organizationId: '',
    name: '',
    description: '',
  });

  // Add members modal state
  const [addingMembersTo, setAddingMembersTo] = useState<{
    type: 'organization' | 'team';
    id: string;
  } | null>(null);
  const [rowZIndex, setRowZIndex] = useState<string | null>(null);

  const handleOpenAddMembers = (type: 'organization' | 'team', id: string) => {
    setAddingMembersTo({ type, id });
    setRowZIndex(id);
  };

  const handleCloseAddMembers = () => {
    setAddingMembersTo(null);
    setRowZIndex(null);
  };

  const handleCreate = () => {
    setCreatingRow(true);
    setExpandedOrganizationId(null);
    setNewOrgData({
      name: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    });
  };

  const handleSave = async (
    id: string,
    field: EditableField,
    value: string,
  ) => {
    if (!value.trim() && field === 'name') {
      setEditingCell(null);
      setEditingValue('');
      return;
    }

    if (id.startsWith('temp-')) {
      const result = await createOrganization(value.trim());
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setCreatingId(null);
        setEditingValue('');
      }
    } else {
      const updateData: Partial<Organization> = {
        [field]: field === 'description' ? value.trim() || null : value.trim(),
      };

      // Optimistic update
      const previousData = queryClient.getQueryData<Organization[]>([
        'organizations',
      ]);

      if (previousData) {
        queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
          if (!old) return old;
          return old.map((org) =>
            org.id === id ? { ...org, ...updateData } : org,
          );
        });
      }

      const result = await updateOrganization(id, updateData);

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        setEditingCell(null);
        setEditingValue('');
      } else {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData<Organization[]>(
            ['organizations'],
            previousData,
          );
        }
      }
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const handleEdit = (organization: Organization) => {
    // Keep this for the Edit button (UI only for now)
    console.log('handleEdit', organization);
  };

  const handleCellEdit = (id: string, field: EditableField) => {
    const org = organizations?.find((o) => o.id === id);
    if (!org) return;

    const value = field === 'name' ? org.name : org.description || '';
    setEditingCell({ id, field });
    setEditingValue(value);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const handleImageUpload = async (file: File, orgId?: string) => {
    if (!orgId) return;

    setUploadingImage(orgId);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);

      const base64String = await base64Promise;

      // Get old picture URL if exists
      const org = organizations?.find((o) => o.id === orgId);
      const oldPictureUrl = org?.picture_url || null;

      // Upload picture
      const uploadResult = await uploadOrganizationPicture(
        orgId,
        base64String,
        oldPictureUrl,
      );

      if (uploadResult.success && uploadResult.data) {
        // Update organization with new picture URL
        await updateOrganizationPicture(orgId, uploadResult.data);
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
        toast.success('Image uploaded successfully');
      } else if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleSaveNewOrg = async () => {
    if (!newOrgData.name.trim()) {
      return;
    }

    setSavingOrg(true);
    try {
      // Create organization
      const createResult = await createOrganization(
        newOrgData.name.trim(),
        newOrgData.description.trim() || null,
      );

      if (!createResult.success) {
        toast.error(createResult.error || 'Failed to create organization');
        return;
      }

      const orgId = createResult.data.id;

      // Upload image if provided
      if (newOrgData.imageFile) {
        setUploadingImage(orgId);
        try {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64String = reader.result as string;
              resolve(base64String);
            };
            reader.onerror = reject;
          });
          reader.readAsDataURL(newOrgData.imageFile);

          const base64String = await base64Promise;
          const uploadResult = await uploadOrganizationPicture(
            orgId,
            base64String,
            null,
          );

          if (uploadResult.success && uploadResult.data) {
            await updateOrganizationPicture(orgId, uploadResult.data);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        } finally {
          setUploadingImage(null);
        }
      }

      // Refresh organizations list
      queryClient.invalidateQueries({ queryKey: ['organizations'] });

      // Reset state
      setCreatingRow(false);
      setNewOrgData({
        name: '',
        description: '',
        imageFile: null,
        imagePreview: null,
      });

      toast.success('Organization created successfully');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast.error('Failed to create organization');
    } finally {
      setSavingOrg(false);
    }
  };

  const handleCancelNewOrg = () => {
    setCreatingRow(false);
    setNewOrgData({
      name: '',
      description: '',
      imageFile: null,
      imagePreview: null,
    });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteOrganization(id);

    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete organization');
    }
  };

  // Teams handlers
  const handleExpandToggle = async (organizationId: string) => {
    if (expandedOrganizationId === organizationId) {
      setExpandedOrganizationId(null);
    } else {
      setExpandedOrganizationId(organizationId);
      // Fetch teams for this organization
      const org = organizations?.find((o) => o.id === organizationId);
      if (org) {
        const teamsResult = await getTeamsByOrganizationId(organizationId);
        if (teamsResult.success) {
          // Update organization with teams data
          queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
            if (!old) return old;
            return old.map((o) =>
              o.id === organizationId
                ? {
                    ...o,
                    teams: teamsResult.data,
                    teams_count: teamsResult.data.length,
                  }
                : o,
            );
          });
        }
      }
    }
  };

  const handleTeamEdit = (id: string, field: EditableTeamField) => {
    const org = organizations?.find((o) => o.id === expandedOrganizationId);
    const team = org?.teams?.find((t) => t.id === id);
    if (!team) return;

    const value = field === 'name' ? team.name : team.description || '';
    setEditingTeam({ id, field });
    setEditingTeamValue(value);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
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
      const updateData: Partial<Team> = {
        [field]:
          field === 'description' ? normalizedNew || null : normalizedNew,
      };

      // Optimistic update
      const previousData = queryClient.getQueryData<Organization[]>([
        'organizations',
      ]);

      if (previousData && expandedOrganizationId) {
        queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
          if (!old) return old;
          return old.map((org) =>
            org.id === expandedOrganizationId
              ? {
                  ...org,
                  teams: org.teams?.map((team) =>
                    team.id === id ? { ...team, ...updateData } : team,
                  ),
                }
              : org,
          );
        });
      }

      const result = await updateTeam(id, updateData);

      if (result.success) {
        // Refetch teams for this organization to update the cache
        if (expandedOrganizationId) {
          const teamsResult = await getTeamsByOrganizationId(
            expandedOrganizationId,
          );
          if (teamsResult.success) {
            queryClient.setQueryData<Organization[]>(
              ['organizations'],
              (old) => {
                if (!old) return old;
                return old.map((o) =>
                  o.id === expandedOrganizationId
                    ? {
                        ...o,
                        teams: teamsResult.data,
                        teams_count: teamsResult.data.length,
                      }
                    : o,
                );
              },
            );
          }
        }
        setEditingTeam(null);
        setEditingTeamValue('');
      } else {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData<Organization[]>(
            ['organizations'],
            previousData,
          );
        }
        toast.error(result.error || 'Failed to update team');
      }
    } else {
      setEditingTeam(null);
      setEditingTeamValue('');
    }
  };

  const handleTeamCancel = () => {
    setEditingTeam(null);
    setEditingTeamValue('');
  };

  const handleTeamCreate = (organizationId: string) => {
    setCreatingTeam(true);
    setNewTeamData({
      organizationId,
      name: '',
      description: '',
    });
  };

  const handleSaveNewTeam = async (organizationId: string) => {
    if (!newTeamData.name.trim()) {
      return;
    }

    setSavingTeam(true);
    try {
      const result = await createTeam(
        organizationId,
        newTeamData.name.trim(),
        newTeamData.description.trim() || null,
      );

      if (!result.success) {
        toast.error(result.error || 'Failed to create team');
        return;
      }

      // Fetch updated teams for this organization
      const teamsResult = await getTeamsByOrganizationId(organizationId);
      if (teamsResult.success) {
        // Update organization with teams data
        queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
          if (!old) return old;
          return old.map((o) =>
            o.id === organizationId
              ? {
                  ...o,
                  teams: teamsResult.data,
                  teams_count: teamsResult.data.length,
                }
              : o,
          );
        });
      }

      // Reset state
      setCreatingTeam(false);
      setNewTeamData({
        organizationId: '',
        name: '',
        description: '',
      });

      toast.success('Team created successfully');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setSavingTeam(false);
    }
  };

  const handleCancelNewTeam = () => {
    setCreatingTeam(false);
    setExpandedOrganizationId(null);
    setNewTeamData({
      organizationId: '',
      name: '',
      description: '',
    });
  };

  const handleTeamDelete = async (teamId: string) => {
    const result = await deleteTeam(teamId);

    if (result.success) {
      // Refetch teams for the expanded organization to update the cache
      if (expandedOrganizationId) {
        const teamsResult = await getTeamsByOrganizationId(
          expandedOrganizationId,
        );
        if (teamsResult.success) {
          queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
            if (!old) return old;
            return old.map((o) =>
              o.id === expandedOrganizationId
                ? {
                    ...o,
                    teams: teamsResult.data,
                    teams_count: teamsResult.data.length,
                  }
                : o,
            );
          });
        }
      }
      toast.success('Team deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete team');
    }
  };

  const displayOrganizations = organizations || [];

  const contextValue = {
    onEdit: handleEdit,
    handleCreate,
    handleSave,
    handleCancel,
    handleCellEdit,
    handleCellBlur,
    creatingId,
    creatingRow,
    editingCell,
    editingValue,
    setEditingValue,
    inputRef,
    newOrgData,
    setNewOrgData,
    uploadingImage,
    setUploadingImage,
    savingOrg,
    handleImageUpload,
    handleSaveNewOrg,
    handleCancelNewOrg,
    handleDelete,
    // Teams
    expandedOrganizationId,
    handleExpandToggle,
    editingTeam,
    editingTeamValue,
    setEditingTeamValue,
    handleTeamEdit,
    handleTeamBlur,
    handleTeamCancel,
    handleTeamCreate,
    handleTeamDelete,
    creatingTeam,
    savingTeam,
    newTeamData,
    setNewTeamData,
    handleSaveNewTeam,
    handleCancelNewTeam,
    addingMembersTo,
    rowZIndex,
    handleOpenAddMembers,
    handleCloseAddMembers,
    setRowZIndex,
  };

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">Organizations & Teams</h1>
      }
    >
      <div
        className={`p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar ${
          !addingMembersTo ? 'glass-background' : ''
        }`}
      >
        <OrganizationsTableProvider value={contextValue}>
          {!isLoading && (
            <Card
              className={`text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden ${
                !addingMembersTo ? 'backdrop-blur-sm' : ''
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
          {addingMembersTo &&
            (() => {
              const targetOrg =
                addingMembersTo.type === 'organization'
                  ? displayOrganizations.find(
                      (o) => o.id === addingMembersTo.id,
                    )
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

              return (
                <AddMembersModal
                  open={!!addingMembersTo}
                  onOpenChange={(open) => {
                    if (!open) handleCloseAddMembers();
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
                />
              );
            })()}
        </OrganizationsTableProvider>
      </div>
    </PageWrapper>
  );
}
