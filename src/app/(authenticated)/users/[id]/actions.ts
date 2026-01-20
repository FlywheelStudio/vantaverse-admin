'use server';

import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { createClient } from '@/lib/supabase/core/server';

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
  if (!programAssignmentId) {
    return {
      success: false as const,
      error: 'Program assignment ID is required',
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc('delete_program', {
      p_program_assignment_id: programAssignmentId,
    });

    if (error) {
      return {
        success: false as const,
        error: error.message || 'Failed to delete program',
      };
    }

    return {
      success: true as const,
      data: undefined,
    };
  } catch (error) {
    console.error('Error deleting program:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to delete program',
    };
  }
}
