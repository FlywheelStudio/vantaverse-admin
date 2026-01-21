'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateOrganization,
  uploadOrganizationPicture,
  updateOrganizationPicture,
} from '@/app/(authenticated)/groups/actions';
import { removeMemberFromOrganization } from '../actions';
import toast from 'react-hot-toast';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { GroupMemberWithProgram } from '../actions';

/**
 * Query key factory for groups
 */
export const groupsKeys = {
  all: ['groups'] as const,
  detail: (id: string | null | undefined) =>
    [...groupsKeys.all, 'detail', id] as const,
  members: (id: string | null | undefined) =>
    [...groupsKeys.detail(id), 'members'] as const,
  physiologist: (id: string | null | undefined) =>
    [...groupsKeys.detail(id), 'physiologist'] as const,
};

interface UpdateOrganizationData {
  id: string;
  data: Partial<Pick<Organization, 'name' | 'description'>>;
}

/**
 * Mutation hook for updating organization (name/description)
 * Includes optimistic updates and error rollback
 */
export function useUpdateOrganization(organizationId: string) {
  const queryClient = useQueryClient();
  const organizationKey = ['organization', organizationId];
  const detailKey = groupsKeys.detail(organizationId);

  return useMutation({
    mutationFn: async (data: Partial<Pick<Organization, 'name' | 'description'>>) => {
      const result = await updateOrganization(organizationId, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update organization');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      // Snapshot previous values
      const previousOrgData = queryClient.getQueryData<Organization>(organizationKey);
      const previousDetailData = queryClient.getQueryData<Organization>(detailKey);

      // Optimistically update both caches
      queryClient.setQueryData<Organization>(organizationKey, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });
      queryClient.setQueryData<Organization>(detailKey, (old) => {
        if (!old) return old;
        return { ...old, ...variables };
      });

      return { previousOrgData, previousDetailData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrgData) {
        queryClient.setQueryData(organizationKey, context.previousOrgData);
      }
      if (context?.previousDetailData) {
        queryClient.setQueryData(detailKey, context.previousDetailData);
      }
      toast.error(error.message || 'Failed to update organization');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['organizations'],
      });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.all,
      });
    },
  });
}

interface UpdateOrganizationPictureData {
  file: File;
}

/**
 * Mutation hook for updating organization picture
 * Handles upload and update in sequence
 */
export function useUpdateOrganizationPicture(organizationId: string) {
  const queryClient = useQueryClient();
  const organizationKey = ['organization', organizationId];
  const detailKey = groupsKeys.detail(organizationId);

  return useMutation({
    mutationFn: async (data: UpdateOrganizationPictureData) => {
      const prev =
        queryClient.getQueryData<Organization>(organizationKey)?.picture_url ||
        queryClient.getQueryData<Organization>(detailKey)?.picture_url;

      // Convert file to base64
      const reader = new FileReader();
      const base64String = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(data.file);
      });

      // Upload picture
      const uploadResult = await uploadOrganizationPicture(
        organizationId,
        base64String,
        prev || undefined,
      );

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(
          'error' in uploadResult && typeof uploadResult.error === 'string'
            ? uploadResult.error
            : 'Failed to upload image',
        );
      }

      // Update organization with new picture URL
      const updateResult = await updateOrganizationPicture(
        organizationId,
        uploadResult.data,
      );

      if (!updateResult.success) {
        throw new Error(
          'error' in updateResult && typeof updateResult.error === 'string'
            ? updateResult.error
            : 'Failed to update image',
        );
      }

      return uploadResult.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationKey });
      await queryClient.cancelQueries({ queryKey: detailKey });

      // Snapshot previous values
      const previousOrgData = queryClient.getQueryData<Organization>(organizationKey);
      const previousDetailData = queryClient.getQueryData<Organization>(detailKey);

      return { previousOrgData, previousDetailData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrgData) {
        queryClient.setQueryData(organizationKey, context.previousOrgData);
      }
      if (context?.previousDetailData) {
        queryClient.setQueryData(detailKey, context.previousDetailData);
      }
      toast.error(error.message || 'Failed to upload image');
    },
    onSuccess: (pictureUrl) => {
      // Optimistically update picture_url in both caches
      queryClient.setQueryData<Organization>(organizationKey, (old) => {
        if (!old) return old;
        return { ...old, picture_url: pictureUrl };
      });
      queryClient.setQueryData<Organization>(detailKey, (old) => {
        if (!old) return old;
        return { ...old, picture_url: pictureUrl };
      });

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ['organizations'],
      });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.all,
      });

      toast.success('Image uploaded successfully');
    },
  });
}

/**
 * Mutation hook for removing a member from organization
 * Includes optimistic updates and error rollback
 */
export function useRemoveGroupMember(organizationId: string) {
  const queryClient = useQueryClient();
  const membersKey = groupsKeys.members(organizationId);

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await removeMemberFromOrganization(organizationId, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member');
      }

      return userId;
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membersKey });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<GroupMemberWithProgram[]>(membersKey);

      // Optimistically remove the member from cache
      queryClient.setQueryData<GroupMemberWithProgram[]>(
        membersKey,
        (old) => {
          if (!old) return old;
          return old.filter((member) => member.user_id !== userId);
        },
      );

      // Show toast immediately
      toast.success('Member removed');

      return { previousData };
    },
    onError: (error, _userId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(membersKey, context.previousData);
      }
      toast.error(error.message || 'Failed to remove member');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: membersKey,
      });
    },
  });
}
