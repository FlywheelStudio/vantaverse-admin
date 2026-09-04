'use server';

import { mutate, query, type DalResult } from '@/lib/dal';
import {
  assignProgramToUser as assignProgramToUserMutation,
  getProgramAssignmentListPaginated,
} from '@/lib/supabase/queries/program-assignments';
import type { ProgramAssignment } from '@/lib/supabase/schemas/program-assignments';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { SupabaseError, SupabaseSuccess } from '@/lib/supabase/result';

function toSupabaseResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

/**
 * Get paginated program assignments with search and status filtering
 */
export async function getProgramAssignmentsPaginated(
  page: number = 1,
  pageSize: number = 25,
  search?: string,
  showAssigned: boolean = false,
): Promise<
  | SupabaseSuccess<{
      data: ProgramAssignmentWithTemplate[];
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    }>
  | SupabaseError
> {
  return toSupabaseResult(
    await query(getProgramAssignmentListPaginated, {
      page,
      pageSize,
      search,
      showAssigned,
    }),
  );
}

/**
 * Assign a program template to a user
 */
export async function assignProgramToUser(
  templateAssignmentId: string,
  userId: string,
  startDate: string,
): Promise<SupabaseSuccess<ProgramAssignment> | SupabaseError> {
  return toSupabaseResult(
    await mutate(assignProgramToUserMutation, {
      templateAssignmentId,
      userId,
      startDate,
    }),
  );
}
