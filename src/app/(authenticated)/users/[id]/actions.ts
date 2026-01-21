'use server';

import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';

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

/**
 * Get patients by organization ID
 */
export async function getPatientsByOrganization(organizationId: string) {
  const query = new ProfilesQuery();
  const result = await query.getPatientsByOrganization(organizationId);
  
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  
  return {
    success: true as const,
    data: result.data.map((p) => ({
      id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      avatar_url: p.avatar_url,
    })),
  };
}
