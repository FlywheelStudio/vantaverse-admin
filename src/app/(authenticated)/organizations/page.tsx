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
import { useQueryClient } from '@tanstack/react-query';
import { OrganizationsTable } from './organizations-table';
import { columns } from './columns';
import { Card } from '@/components/ui/card';
import { OrganizationsTableProvider } from './context';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { EditableField } from './context';

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

  const handleCreate = () => {
    setCreatingRow(true);
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
    handleImageUpload,
    handleSaveNewOrg,
    handleCancelNewOrg,
    handleDelete,
  };

  return (
    <PageWrapper
      subheader={
        <h1 className="text-2xl font-medium">Organizations & Teams</h1>
      }
    >
      <div className="p-6 flex-1 min-h-0 overflow-y-auto glass-background h-full slim-scrollbar">
        <OrganizationsTableProvider value={contextValue}>
          {!isLoading && (
            <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden">
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
        </OrganizationsTableProvider>
      </div>
    </PageWrapper>
  );
}
