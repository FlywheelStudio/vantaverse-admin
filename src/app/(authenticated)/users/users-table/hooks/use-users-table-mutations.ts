'use client';

import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {
  importUsersCSV,
  importUsersExcel,
  deleteAuthUser,
  makeSuperAdmin,
  revokeSuperAdmin,
} from '../../actions';
import toast from 'react-hot-toast';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

/** List caches that render /users (legacy `useUsers` + `useMembersFiltered`). */
const USER_DIRECTORY_QUERY_KEYS = ['users', 'members-filtered'] as const;

type UserDirectorySnapshot = Array<
  [QueryKey, ProfileWithStats[] | undefined]
>;

const snapshotUserDirectory = (queryClient: QueryClient): UserDirectorySnapshot =>
  USER_DIRECTORY_QUERY_KEYS.flatMap((key) =>
    queryClient.getQueriesData<ProfileWithStats[]>({ queryKey: [key] }),
  );

const cancelUserDirectoryQueries = async (
  queryClient: QueryClient,
): Promise<void> => {
  await Promise.all(
    USER_DIRECTORY_QUERY_KEYS.map((key) =>
      queryClient.cancelQueries({ queryKey: [key] }),
    ),
  );
};

const restoreUserDirectory = (
  queryClient: QueryClient,
  snapshot: UserDirectorySnapshot,
): void => {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const invalidateUserDirectory = (queryClient: QueryClient): void => {
  for (const key of USER_DIRECTORY_QUERY_KEYS) {
    void queryClient.invalidateQueries({ queryKey: [key] });
  }
  void queryClient.invalidateQueries({ queryKey: ['member-filter-counts'] });
};

/**
 * Parse CSV into staged invite rows (no user creation / cache invalidation).
 */
export function useImportUsersCSV() {
  return useMutation({
    mutationFn: async (data: { csvText: string }) => {
      const result = await importUsersCSV(data.csvText);

      if (!result.success) {
        throw new Error(result.error || 'Failed to import CSV file');
      }

      return result.data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import CSV file');
    },
  });
}

/**
 * Parse Excel into staged invite rows (no user creation / cache invalidation).
 */
export function useImportUsersExcel() {
  return useMutation({
    mutationFn: async (data: { fileData: ArrayBuffer }) => {
      const result = await importUsersExcel(data.fileData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to import Excel file');
      }

      return result.data;
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import Excel file');
    },
  });
}


/**
 * Bulk delete users in parallel with a single optimistic update
 */
export function useBulkDeleteUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userIds: string[]) => {
      const results = await Promise.all(
        userIds.map((id) => deleteAuthUser(id)),
      );
      const failed = results.find((r) => !r.success);
      if (failed && !failed.success) {
        throw new Error(failed.error || 'Failed to delete users');
      }
      return userIds;
    },
    onMutate: async (userIds) => {
      await cancelUserDirectoryQueries(queryClient);
      const previousUserQueries = snapshotUserDirectory(queryClient);
      const ids = new Set(userIds);
      const filterOut = (
        old: ProfileWithStats[] | undefined,
      ): ProfileWithStats[] | undefined => {
        if (!old) return old;
        return old.filter((user) => !ids.has(user.id));
      };
      for (const key of USER_DIRECTORY_QUERY_KEYS) {
        queryClient.setQueriesData<ProfileWithStats[]>(
          { queryKey: [key] },
          filterOut,
        );
      }
      return { previousUserQueries };
    },
    onError: (_error, _userIds, context) => {
      if (context?.previousUserQueries) {
        restoreUserDirectory(queryClient, context.previousUserQueries);
      }
      toast.error('Failed to delete users');
    },
    onSuccess: (userIds) => {
      invalidateUserDirectory(queryClient);
      toast.success(
        `Deleted ${userIds.length} user${userIds.length > 1 ? 's' : ''}`,
      );
    },
  });
}

/**
 * Bulk toggle super admin in parallel with a single optimistic update
 */
export function useBulkToggleSuperAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      userIds: string[];
      targetIsAdmin: boolean;
    }) => {
      const { userIds, targetIsAdmin } = args;
      const results = await Promise.all(
        userIds.map((id) =>
          targetIsAdmin ? makeSuperAdmin(id) : revokeSuperAdmin(id),
        ),
      );
      const failed = results.find((r) => !r.success);
      if (failed && !failed.success) {
        throw new Error(failed.error || 'Failed to update roles');
      }
      return { userIds, targetIsAdmin };
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUserQueries = queryClient.getQueriesData<
        ProfileWithStats[]
      >({ queryKey: ['users'] });
      const { userIds, targetIsAdmin } = variables;
      const set = new Set(userIds);
      queryClient.setQueriesData<ProfileWithStats[]>(
        { queryKey: ['users'] },
        (old) => {
          if (!old) return old;
          return old.map((u) =>
            set.has(u.id) ? { ...u, is_super_admin: targetIsAdmin } : u,
          );
        },
      );
      return { previousUserQueries };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousUserQueries) {
        context.previousUserQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error('Failed to update roles');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const n = data.userIds.length;
      toast.success(
        data.targetIsAdmin
          ? `${n} user${n > 1 ? 's' : ''} made admin${n > 1 ? 's' : ''}`
          : `${n} user${n > 1 ? 's' : ''} made member${n > 1 ? 's' : ''}`,
      );
    },
  });
}
