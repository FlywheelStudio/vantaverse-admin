'use server';

import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';

/**
 * Get paginated program assignments with search and status filtering
 */
export async function getProgramAssignmentsPaginated(
  page: number = 1,
  pageSize: number = 25,
  search?: string,
  showAssigned: boolean = false,
) {
  const query = new ProgramAssignmentsQuery();
  return query.getListPaginated(page, pageSize, search, showAssigned);
}

/**
 * Assign a program template to a user
 */
export async function assignProgramToUser(
  templateAssignmentId: string,
  userId: string,
  startDate: string, // ISO date string (YYYY-MM-DD)
) {
  const query = new ProgramAssignmentsQuery();
  return query.assignToUser(templateAssignmentId, userId, startDate);
}

/**
 * Delete a program using the delete_program RPC function
 */
export async function deleteProgram(programAssignmentId: string) {
  const query = new ProgramAssignmentsQuery();
  const result = await query.deleteProgramRPC(programAssignmentId);

  if (!result.success) {
    return { success: false as const, error: result.error };
  }

  return { success: true as const, data: undefined };
}
