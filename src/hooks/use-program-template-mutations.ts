'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createProgramTemplate,
  updateProgramTemplate,
  uploadProgramTemplateImage,
  updateProgramTemplateImage,
} from '@/app/(authenticated)/builder/actions';
import { programAssignmentsKeys } from './use-passignments';
import toast from 'react-hot-toast';
import { formatDateForDB } from '@/lib/utils';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface CreateProgramTemplateData {
  name: string;
  weeks: number;
  startDate?: Date;
  description?: string | null;
  goals?: string | null;
  notes?: string | null;
  imageFile?: File | null;
  imagePreview?: string | null;
}

interface UpdateProgramTemplateData {
  templateId: string;
  name: string;
  weeks: number;
  startDate?: Date;
  endDate?: Date;
  description?: string | null;
  goals?: string | null;
  notes?: string | null;
  imageFile?: File | null;
  imagePreview?: string | null;
  oldImageUrl?: string | null;
  organizationId?: string | null;
}

interface UseCreateProgramTemplateOptions {
  onSuccess?: () => void;
}

interface UseUpdateProgramTemplateOptions {
  onSuccess?: () => void;
  suppressToast?: boolean;
}

/**
 * Mutation hook for creating a program template
 */
export function useCreateProgramTemplate(
  options?: UseCreateProgramTemplateOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProgramTemplateData) => {
      const startDateString = data.startDate
        ? formatDateForDB(data.startDate)
        : null;

      // Create template
      const createResult = await createProgramTemplate(
        data.name.trim(),
        data.weeks,
        startDateString,
        data.description?.trim() || null,
        data.goals?.trim() || null,
        data.notes?.trim() || null,
        null, // organizationId - can be added later if needed
      );

      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create program');
      }

      const templateId = createResult.data.template.id;
      const organizationId = createResult.data.template.organization_id;

      // Upload image if provided
      if (data.imageFile && data.imagePreview) {
        try {
          const uploadResult = await uploadProgramTemplateImage(
            templateId,
            organizationId,
            data.imagePreview,
            null,
          );

          if (uploadResult.success && uploadResult.data) {
            await updateProgramTemplateImage(templateId, uploadResult.data);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          // Don't fail the whole operation if image upload fails
          toast.error('Program created but image upload failed');
        }
      }

      return createResult.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: programAssignmentsKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({
        queryKey: programAssignmentsKeys.lists(),
      });

      return { previousData };
    },
    onError: (error, __variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create program');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: programAssignmentsKeys.lists(),
      });
      toast.success('Program created successfully');
      options?.onSuccess?.();
    },
  });
}

/**
 * Mutation hook for updating a program template
 */
export function useUpdateProgramTemplate(
  options?: UseUpdateProgramTemplateOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProgramTemplateData) => {
      const startDateString = data.startDate
        ? formatDateForDB(data.startDate)
        : null;
      const endDateString = data.endDate ? formatDateForDB(data.endDate) : null;

      // Update template
      const updateResult = await updateProgramTemplate(
        data.templateId,
        data.name.trim(),
        data.weeks,
        data.description?.trim() || null,
        data.goals?.trim() || null,
        data.notes?.trim() || null,
        startDateString,
        endDateString,
      );

      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Failed to update program');
      }

      // Upload image if a new one is provided
      if (data.imageFile && data.imagePreview) {
        try {
          const uploadResult = await uploadProgramTemplateImage(
            data.templateId,
            data.organizationId || null,
            data.imagePreview,
            data.oldImageUrl || null,
          );

          if (uploadResult.success && uploadResult.data) {
            await updateProgramTemplateImage(
              data.templateId,
              uploadResult.data,
            );
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          // Don't fail the whole operation if image upload fails
          toast.error('Program updated but image upload failed');
        }
      }

      return updateResult.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: programAssignmentsKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({
        queryKey: programAssignmentsKeys.lists(),
      });

      // Optimistically update the cache
      queryClient.setQueriesData<{
        pages: Array<{
          data: ProgramAssignmentWithTemplate[];
          page: number;
          pageSize: number;
          total: number;
          hasMore: boolean;
        }>;
        pageParams: number[];
      }>(
        {
          queryKey: programAssignmentsKeys.lists(),
        },
        (old) => {
          if (!old) return old;

          // For infinite queries, update all pages
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((item) => {
                  if (item.program_template?.id === variables.templateId) {
                    return {
                      ...item,
                      program_template: {
                        ...item.program_template,
                        name: variables.name,
                        weeks: variables.weeks,
                        description: variables.description || null,
                        goals: variables.goals || null,
                        notes: variables.notes || null,
                      } as ProgramTemplate,
                    };
                  }
                  return item;
                }),
              })),
            };
          }

          return old;
        },
      );

      return { previousData };
    },
    onError: (error, __variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (!options?.suppressToast) {
        toast.error(error.message || 'Failed to update program');
      }
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: programAssignmentsKeys.lists(),
      });
      if (!options?.suppressToast) {
        toast.success('Program updated successfully');
      }
      options?.onSuccess?.();
    },
  });
}
