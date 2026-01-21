'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createUserQuickAdd,
  importUsersCSV,
  importUsersExcel,
  deleteUser,
  makeSuperAdmin,
  revokeSuperAdmin,
} from '../../actions';
import toast from 'react-hot-toast';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface CreateUserQuickAddData {
  email: string;
  firstName: string;
  lastName: string;
  role: MemberRole;
}

/**
 * Creates an optimistic user object for optimistic updates
 */
function createOptimisticUser(variables: CreateUserQuickAddData): ProfileWithStats {
  return {
    id: `temp-${Date.now()}`,
    email: variables.email.trim().toLowerCase(),
    first_name: variables.firstName.trim() || null,
    last_name: variables.lastName.trim() || null,
    status: 'pending',
    description: null,
    phone: null,
    journey_phase: null,
    screening_completed: null,
    intro_completed: null,
    consultation_completed: null,
    program_assigned: null,
    program_started: null,
    program_due_date: null,
    avatar_url: null,
    certificate_url: null,
    timezone: null,
    last_sign_in: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    current_level: null,
    current_phase: null,
    empowerment: null,
    empowerment_base: null,
    empowerment_metadata: null,
    empowerment_threshold: null,
    empowerment_title: null,
    empowerment_top: null,
    hp_points: null,
    max_gate_type: null,
    max_gate_unlocked: null,
    points_required_for_next_level: null,
    program_completion_percentage: null,
    program_weeks: null,
    program_assignment_id: null,
    program_assignment_name: null,
    is_super_admin: false,
    orgMemberships: [],
  };
}

/**
 * Mutation hook for creating a user via quick add
 * Includes optimistic updates
 */
export function useCreateUserQuickAdd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserQuickAddData) => {
      const result = await createUserQuickAdd({
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        role: data.role,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create user');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });

      // Snapshot previous values for all user queries
      const previousQueries = queryClient.getQueriesData<ProfileWithStats[]>({
        queryKey: ['users'],
      });

      // Create optimistic user entry
      const optimisticUser = createOptimisticUser(variables);

      // Optimistically add user to all user queries
      queryClient.setQueriesData<ProfileWithStats[]>(
        { queryKey: ['users'] },
        (old) => {
          if (!old) return old;
          return [optimisticUser, ...old];
        },
      );

      return { previousQueries };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create user');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('User added');
    },
  });
}

/**
 * Mutation hook for importing users from CSV
 * No optimistic updates (batch operation, complex result)
 */
export function useImportUsersCSV() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { csvText: string; role: MemberRole }) => {
      const result = await importUsersCSV(data.csvText, data.role);

      if (!result.success) {
        throw new Error(result.error || 'Failed to import CSV file');
      }

      return result.data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import CSV file');
    },
    onSuccess: (data) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });

      if (data.errors.length > 0) {
        toast.error(
          `${data.errors.length} issue${data.errors.length > 1 ? 's' : ''} found during import`,
        );
      }
    },
  });
}

/**
 * Mutation hook for importing users from Excel
 * No optimistic updates (batch operation, complex result)
 */
export function useImportUsersExcel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { fileData: ArrayBuffer; role: MemberRole }) => {
      const result = await importUsersExcel(data.fileData, data.role);

      if (!result.success) {
        throw new Error(result.error || 'Failed to import Excel file');
      }

      return result.data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import Excel file');
    },
    onSuccess: (data) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });

      if (data.errors.length > 0) {
        toast.error(
          `${data.errors.length} issue${data.errors.length > 1 ? 's' : ''} found during import`,
        );
      }
    },
  });
}

/**
 * Mutation hook for deleting a user
 * Includes optimistic updates
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await deleteUser(userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user');
      }

      return userId;
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });
      await queryClient.cancelQueries({ queryKey: ['user-profile', userId] });

      // Snapshot previous values
      const previousUserQueries = queryClient.getQueriesData<ProfileWithStats[]>(
        { queryKey: ['users'] },
      );
      const previousProfileData = queryClient.getQueryData<ProfileWithStats | null>(
        ['user-profile', userId],
      );

      // Optimistically remove user from all user queries
      queryClient.setQueriesData<ProfileWithStats[]>(
        { queryKey: ['users'] },
        (old) => {
          if (!old) return old;
          return old.filter((user) => user.id !== userId);
        },
      );

      // Optimistically remove user profile
      queryClient.setQueryData<ProfileWithStats | null>(
        ['user-profile', userId],
        null,
      );

      return { previousUserQueries, previousProfileData };
    },
    onError: (error, userId, context) => {
      // Rollback on error
      if (context?.previousUserQueries) {
        context.previousUserQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousProfileData !== undefined) {
        queryClient.setQueryData(['user-profile', userId], context.previousProfileData);
      }
      toast.error(error.message || 'Failed to delete user');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
  });
}

/**
 * Mutation hook for toggling super admin status
 * Includes optimistic updates
 */
export function useToggleSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; isSuperAdmin: boolean }) => {
      const result = data.isSuperAdmin
        ? await revokeSuperAdmin(data.userId)
        : await makeSuperAdmin(data.userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to toggle role');
      }

      return { userId: data.userId, isSuperAdmin: !data.isSuperAdmin };
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] });
      await queryClient.cancelQueries({
        queryKey: ['user-profile', variables.userId],
      });

      // Snapshot previous values
      const previousUserQueries = queryClient.getQueriesData<ProfileWithStats[]>(
        { queryKey: ['users'] },
      );
      const previousProfileData = queryClient.getQueryData<ProfileWithStats | null>(
        ['user-profile', variables.userId],
      );

      // Optimistically update is_super_admin in all user queries
      queryClient.setQueriesData<ProfileWithStats[]>(
        { queryKey: ['users'] },
        (old) => {
          if (!old) return old;
          return old.map((user) =>
            user.id === variables.userId
              ? { ...user, is_super_admin: !variables.isSuperAdmin }
              : user,
          );
        },
      );

      // Optimistically update user profile
      queryClient.setQueryData<ProfileWithStats | null>(
        ['user-profile', variables.userId],
        (old) => {
          if (!old) return old;
          return { ...old, is_super_admin: !variables.isSuperAdmin };
        },
      );

      return { previousUserQueries, previousProfileData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousUserQueries) {
        context.previousUserQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousProfileData !== undefined) {
        queryClient.setQueryData(
          ['user-profile', variables.userId],
          context.previousProfileData,
        );
      }
      toast.error(error.message || 'Failed to toggle role');
    },
    onSuccess: (data) => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        data.isSuperAdmin
          ? 'Member made physician successfully'
          : 'Physician made member successfully',
      );
    },
  });
}
