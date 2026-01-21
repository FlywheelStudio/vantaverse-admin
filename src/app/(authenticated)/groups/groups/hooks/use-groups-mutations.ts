'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrganizationPicture,
  updateOrganizationPicture,
} from '../../actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';

/**
 * Query key factory for organizations
 */
export const organizationsKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationsKeys.all, 'list'] as const,
  detail: (id: string) => [...organizationsKeys.all, 'detail', id] as const,
};

/**
 * Mutation hook for creating an organization
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description?: string | null;
    }) => {
      const result = await createOrganization(name, description);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create organization');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      toast.success('Organization created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });
}

/**
 * Mutation hook for updating an organization
 * Includes optimistic updates and error rollback
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Organization>;
    }) => {
      const result = await updateOrganization(id, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update organization');
      }

      return result.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationsKeys.all });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);

      // Optimistically update
      queryClient.setQueryData<Organization[]>(
        organizationsKeys.all,
        (old) => {
          if (!old) return old;
          return old.map((org) => (org.id === id ? { ...org, ...data } : org));
        },
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(organizationsKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to update organization');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
    },
  });
}

/**
 * Mutation hook for deleting an organization
 * Includes optimistic updates and error rollback
 */
export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteOrganization(id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete organization');
      }

      return id;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationsKeys.all });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);

      // Optimistically remove
      queryClient.setQueryData<Organization[]>(
        organizationsKeys.all,
        (old) => {
          if (!old) return old;
          return old.filter((org) => org.id !== id);
        },
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(organizationsKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to delete organization');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      toast.success('Organization deleted successfully');
    },
  });
}

/**
 * Mutation hook for uploading organization picture
 * Handles upload and update in sequence
 */
export function useUploadOrganizationPicture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      file,
      oldPictureUrl,
    }: {
      organizationId: string;
      file: File;
      oldPictureUrl?: string | null;
    }) => {
      // Convert file to base64
      const reader = new FileReader();
      const base64String = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload picture
      const uploadResult = await uploadOrganizationPicture(
        organizationId,
        base64String,
        oldPictureUrl || undefined,
      );

      if (!uploadResult.success) {
        throw new Error(
          uploadResult.error || 'Failed to upload image',
        );
      }

      if (!uploadResult.data) {
        throw new Error('Failed to upload image');
      }

      // Update organization with new picture URL
      const updateResult = await updateOrganizationPicture(
        organizationId,
        uploadResult.data,
      );

      if (!updateResult.success) {
        throw new Error(
          updateResult.error || 'Failed to update image',
        );
      }

      return uploadResult.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: organizationsKeys.all });

      const previousData =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(organizationsKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to upload image');
    },
    onSuccess: (pictureUrl, { organizationId }) => {
      // Optimistically update picture_url
      queryClient.setQueryData<Organization[]>(
        organizationsKeys.all,
        (old) => {
          if (!old) return old;
          return old.map((org) =>
            org.id === organizationId
              ? { ...org, picture_url: pictureUrl }
              : org,
          );
        },
      );

      queryClient.invalidateQueries({ queryKey: organizationsKeys.all });
      toast.success('Image uploaded successfully');
    },
  });
}
