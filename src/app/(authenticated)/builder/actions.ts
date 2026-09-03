'use server';

import { formatDalError, mutate, query, type DalResult } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { ExercisesQuery } from '@/lib/supabase/queries/exercises';
import {
  editExerciseTemplateMutation,
  getExerciseTemplatesByIds as getExerciseTemplatesByIdsQuery,
  listExerciseTemplatesPaginated,
  upsertExerciseTemplateMutation,
} from '@/lib/supabase/queries/exercise-templates';
import {
  createProgramTemplate as createProgramTemplateMutation,
  updateProgramTemplate as updateProgramTemplateMutation,
} from '@/lib/supabase/queries/program-templates';
import { GroupsQuery } from '@/lib/supabase/queries/groups';
import {
  getWorkoutScheduleDataByAssignmentId,
  upsertWorkoutScheduleMutation,
} from '@/lib/supabase/queries/workout-schedules';
import { SupabaseStorage } from '@/lib/supabase/storage';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { createClient } from '@/lib/supabase/core/server';
import { DatabaseSchedule } from './[id]/workout-schedule/utils';
import type { Group } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import type { ProgramAssignment } from '@/lib/supabase/schemas/program-assignments';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';

type LegacySuccess<T> = { success: true; data: T };
type LegacyError = { success: false; error: string };
type LegacyResult<T> = LegacySuccess<T> | LegacyError;

function fromDalResult<T>(result: DalResult<T>): LegacyResult<T> {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

/**
 * Get paginated program assignments with status='template' (joined with program_template)
 * Supports server-side filtering for search and weeks
 */
export async function getProgramAssignmentsPaginated(
  page: number = 1,
  pageSize: number = 16,
  search?: string,
  weeks?: number,
  showAssigned: boolean = false,
) {
  const query = new ProgramAssignmentsQuery();
  return query.getTemplatesPaginated(
    page,
    pageSize,
    search,
    weeks,
    showAssigned,
  );
}

/**
 * Bulk-assign a template-status program to multiple users with one shared start date.
 * End dates are calculated from the template's week count per user.
 */
export async function bulkAssignProgramToUsers(
  templateAssignmentId: string,
  userIds: string[],
  startDate: string, // ISO date string (YYYY-MM-DD)
): Promise<{
  success: boolean;
  assigned: number;
  failed: Array<{ userId: string; error: string }>;
}> {
  const query = new ProgramAssignmentsQuery();
  const failed: Array<{ userId: string; error: string }> = [];
  let assigned = 0;

  for (const userId of userIds) {
    const result = await query.assignToUser(
      templateAssignmentId,
      userId,
      startDate,
    );
    if (result.success) {
      assigned += 1;
    } else {
      failed.push({ userId, error: result.error });
    }
  }

  return { success: failed.length === 0, assigned, failed };
}

/**
 * Update start/end dates for specific program assignments (date propagation)
 */
export async function updateAssignmentDates(
  assignmentIds: string[],
  startDate: string, // ISO date string (YYYY-MM-DD)
  endDate: string, // ISO date string (YYYY-MM-DD)
) {
  const query = new ProgramAssignmentsQuery();
  return query.updateDatesByIds(assignmentIds, startDate, endDate);
}

/**
 * Get all patients (role='patient') in an organization
 */
export async function getOrganizationPatients(organizationId: string) {
  const query = new ProfilesQuery();
  return query.getPatientsByOrganization(organizationId);
}

/**
 * Get a single program assignment by ID (joined with program_template)
 */
export async function getProgramAssignmentById(id: string) {
  const query = new ProgramAssignmentsQuery();
  return query.getById(id);
}

/**
 * Get the global pre-program template assignment for the pinned builder card.
 */
export async function getPreProgramTemplate() {
  const query = new ProgramAssignmentsQuery();
  return query.getPreProgramTemplate();
}

/**
 * Create a new program template and program assignment
 */
export async function createProgramTemplate(
  name: string,
  weeks: number,
  startDate?: string | null,
  description?: string | null,
  goals?: string | null,
  notes?: string | null,
  organizationId?: string | null,
): Promise<
  | LegacySuccess<{
      template: ProgramTemplate;
      assignment: ProgramAssignment;
    }>
  | LegacyError
> {
  const assignmentQuery = new ProgramAssignmentsQuery();
  const client = await createClient();

  const templateResult = fromDalResult(
    await mutate(
      createProgramTemplateMutation,
      {
        name,
        weeks,
        description,
        goals,
        notes,
        organizationId,
      },
      { client },
    ),
  );

  if (!templateResult.success) {
    return templateResult;
  }

  const templateId = templateResult.data.id;

  // Template assignments never have dates
  const assignmentResult = await assignmentQuery.create(
    templateId,
    null,
    null,
    organizationId,
  );

  if (!assignmentResult.success) {
    // If assignment creation fails, we could optionally rollback template creation
    // For now, we'll return the error
    return assignmentResult;
  }

  // Return both template and assignment data
  return {
    success: true as const,
    data: {
      template: templateResult.data,
      assignment: assignmentResult.data,
    },
  };
}

/**
 * Upload program template image
 */
export async function uploadProgramTemplateImage(
  templateId: string,
  organizationId: string | null,
  fileBase64: string,
  oldImageUrl?: string | null | { image_url: string; blur_hash: string },
) {
  // Validate file type
  const base64Header = fileBase64.substring(0, 30);
  const isJpeg =
    base64Header.includes('data:image/jpeg') ||
    base64Header.includes('data:image/jpg');
  const isPng = base64Header.includes('data:image/png');

  if (!isJpeg && !isPng) {
    return {
      success: false as const,
      error: 'Invalid file type. Only JPEG and PNG images are allowed.',
    };
  }

  // If no organization ID, use 'default' folder
  const orgFolder = organizationId || 'default';

  const storage = new SupabaseStorage();
  const extension = isJpeg ? 'jpg' : 'png';
  const path = `${orgFolder}/program-templates/${templateId}/image.${extension}`;
  const contentType = isJpeg ? 'image/jpeg' : 'image/png';

  // Delete old image if it exists
  if (oldImageUrl) {
    // Extract path from URL - format: {orgId}/program-templates/{templateId}/image.{ext}
    // oldImageUrl can be a string or extracted from JSONB object
    const urlToUse =
      typeof oldImageUrl === 'string'
        ? oldImageUrl
        : typeof oldImageUrl === 'object' &&
            oldImageUrl !== null &&
            'image_url' in oldImageUrl
          ? String(oldImageUrl.image_url)
          : null;

    if (urlToUse) {
      const urlParts = urlToUse.split('/');
      const oldPathIndex = urlParts.findIndex((part) =>
        part.includes('program-templates'),
      );
      if (oldPathIndex !== -1) {
        const oldPath = urlParts.slice(oldPathIndex - 1).join('/');
        await storage.delete('organization_assets', oldPath);
      }
    }
  }

  // Upload new image
  const result = await storage.upload({
    bucket: 'organization_assets',
    path,
    body: fileBase64,
    contentType,
    upsert: true,
    getPublicUrl: true,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    data: result.data.publicUrl,
  };
}

/**
 * Delete a program assignment and its associated template
 * Deletes the template, which cascades to delete the assignment
 */
export async function deleteProgramAssignment(assignmentId: string) {
  const assignmentQuery = new ProgramAssignmentsQuery();

  // Delete the assignment
  const deleteAssignmentResult = await assignmentQuery.delete(assignmentId);

  if (!deleteAssignmentResult.success) {
    return deleteAssignmentResult;
  }

  return {
    success: true as const,
    data: undefined,
  };
}

/**
 * Clone a program assignment into a new template (new program_template + program_assignment).
 * Returns the new assignment id for redirect.
 */
export async function cloneProgramAssignment(assignmentId: string) {
  const assignmentQuery = new ProgramAssignmentsQuery();

  const result = await assignmentQuery.cloneToTemplate(assignmentId);

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    data: { assignmentId: result.data.assignment.id },
  };
}

/**
 * Update a program template
 */
export async function updateProgramTemplate(
  templateId: string,
  name: string,
  weeks: number,
  description?: string | null,
  goals?: string | null,
  notes?: string | null,
  startDate?: string | null,
  endDate?: string | null,
  comingSoonWeeks?: number,
): Promise<LegacySuccess<ProgramTemplate> | LegacyError> {
  const clampedComingSoon = Math.min(
    Math.max(comingSoonWeeks ?? 0, 0),
    Math.max(weeks, 0),
  );

  const updateResult = fromDalResult(
    await mutate(
      updateProgramTemplateMutation,
      {
        id: templateId,
        data: {
          name: name.trim(),
          weeks,
          coming_soon_weeks: clampedComingSoon,
          description: description?.trim() || null,
          goals: goals?.trim() || null,
          notes: notes?.trim() || null,
        },
      },
    ),
  );

  if (!updateResult.success) {
    return updateResult;
  }

  const assignmentQuery = new ProgramAssignmentsQuery();
  if (startDate && endDate) {
    const updateDatesResult = await assignmentQuery.updateDatesByTemplateId(
      templateId,
      startDate,
      endDate,
    );

    if (!updateDatesResult.success) {
      return updateDatesResult;
    }
  } else {
    // Clear dates on template assignment when saving a template (no dates)
    const clearResult =
      await assignmentQuery.clearDatesByTemplateId(templateId);
    if (!clearResult.success) {
      return clearResult;
    }
  }

  return {
    success: true as const,
    data: updateResult.data,
  };
}

/**
 * Update program template image URL
 */
export async function updateProgramTemplateImage(
  templateId: string,
  imageUrl: string | null,
): Promise<LegacySuccess<ProgramTemplate> | LegacyError> {
  const imageUrlData = imageUrl
    ? {
        image_url: imageUrl,
        blur_hash: '',
      }
    : null;

  return fromDalResult(
    await mutate(
      updateProgramTemplateMutation,
      {
        id: templateId,
        data: { image_url: imageUrlData as unknown },
      },
    ),
  );
}

/**
 * Get paginated exercises with search and sort
 */
export async function getExercisesPaginated(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  sortBy: string = 'updated_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  type?: string | null,
) {
  const query = new ExercisesQuery();
  return query.getListPaginated(
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    type,
  );
}

/**
 * Get distinct exercise types (sources) for filter dropdown
 */
export async function getExerciseTypes() {
  const query = new ExercisesQuery();
  return query.getDistinctTypes();
}

/**
 * Get paginated exercise templates with search and sort
 */
export async function getExerciseTemplatesPaginated(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  sortBy: string = 'updated_at',
  sortOrder: 'asc' | 'desc' = 'desc',
) {
  return fromDalResult(
    await queryWithSession(listExerciseTemplatesPaginated, {
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
    }),
  );
}

/**
 * Get paginated groups with search and sort
 */
export async function getGroupsPaginated(
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  sortBy: string = 'updated_at',
  sortOrder: 'asc' | 'desc' = 'desc',
) {
  const query = new GroupsQuery();
  return query.getListPaginated(page, pageSize, search, sortBy, sortOrder);
}

/**
 * Get multiple exercise templates by IDs
 */
export async function getExerciseTemplatesByIds(
  ids: string[],
): Promise<LegacySuccess<ExerciseTemplate[]> | LegacyError> {
  const result = fromDalResult(
    await queryWithSession(getExerciseTemplatesByIdsQuery, ids),
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    data: Object.values(result.data),
  };
}

/**
 * Upsert exercise template via RPC function
 */
export async function upsertExerciseTemplate(data: {
  p_exercise_id: number;
  p_sets?: number;
  p_rep?: number | null;
  p_time?: number | null;
  p_distance?: string | null;
  p_weight?: string | null;
  p_rest_time?: number | null;
  p_tempo?: string[] | null;
  p_rep_override?: number[] | null;
  p_time_override?: number[] | null;
  p_distance_override?: string[] | null;
  p_weight_override?: string[] | null;
  p_rest_time_override?: number[] | null;
  p_notes?: string;
}): Promise<
  | { success: true; data: { id: string; template_hash: string } }
  | { success: false; error: string }
> {
  const client = await createClient();
  const result = fromDalResult(
    await mutate(upsertExerciseTemplateMutation, data, { client }),
  );

  if (!result.success) {
    return result;
  }

  const rpcResult = result.data as {
    id: string;
    template_hash: string;
    cloned?: boolean;
    reference_count?: number;
    original_id?: string;
  };

  return {
    success: true,
    data: {
      id: rpcResult.id,
      template_hash: rpcResult.template_hash,
    },
  };
}

/**
 * Edit existing exercise template via RPC (updates the row by id)
 */
export async function editExerciseTemplate(data: {
  p_template_id: string;
  p_exercise_id: number;
  p_sets?: number;
  p_rep?: number | null;
  p_time?: number | null;
  p_distance?: string | null;
  p_weight?: string | null;
  p_rest_time?: number | null;
  p_tempo?: string[] | null;
  p_rep_override?: number[] | null;
  p_time_override?: number[] | null;
  p_distance_override?: string[] | null;
  p_weight_override?: string[] | null;
  p_rest_time_override?: number[] | null;
  p_notes?: string;
}): Promise<
  | { success: true; data: { id: string; template_hash: string } }
  | { success: false; error: string }
> {
  const client = await createClient();
  const result = fromDalResult(
    await mutate(editExerciseTemplateMutation, data, { client }),
  );

  if (!result.success) {
    return result;
  }

  const rpcResult = result.data as {
    id?: string;
    template_hash?: string;
  };

  return {
    success: true,
    data: {
      id: rpcResult.id ?? data.p_template_id,
      template_hash: rpcResult.template_hash ?? '',
    },
  };
}

/**
 * Upsert group via RPC function
 * Returns either success with group data or error
 */
export async function upsertGroup(data: {
  p_title: string;
  p_exercise_template_ids?: string[];
  p_is_superset?: boolean;
  p_note?: string;
}): Promise<
  | {
      success: true;
      data: {
        id: string;
        group_hash: string;
        cloned: boolean;
        reference_count: number;
        original_id?: string;
      };
    }
  | { success: false; error: string }
> {
  const query = new GroupsQuery();
  return query.upsertGroup(data);
}

/**
 * Upsert workout schedule via RPC function
 */
export async function upsertWorkoutSchedule(
  schedule: DatabaseSchedule,
  notes?: string,
) {
  const client = await createClient();
  return fromDalResult(
    await mutate(upsertWorkoutScheduleMutation, { schedule, notes }, { client }),
  );
}

/**
 * Get workout schedule data for a program assignment
 * Fetches program_assignment with patient_override and workout_schedules.schedule
 */
export async function getWorkoutScheduleData(programAssignmentId: string) {
  const result = fromDalResult(
    await queryWithSession(
      getWorkoutScheduleDataByAssignmentId,
      programAssignmentId,
    ),
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    data: {
      schedule: result.data.schedule,
      patientOverride: result.data.patientOverride,
    },
  };
}

/**
 * Update program assignment workout schedule ID
 */
export async function updateProgramSchedule(
  assignmentId: string,
  workoutScheduleId: string,
) {
  const query = new ProgramAssignmentsQuery();
  return query.updateWorkoutScheduleId(assignmentId, workoutScheduleId);
}

/**
 * Convert database schedule format to SelectedItem[][][] format
 * Server action version that uses server-side query classes
 */
export async function convertScheduleToSelectedItems(
  schedule: unknown,
): Promise<
  { success: true; data: unknown } | { success: false; error: string }
> {
  type DatabaseScheduleDay = {
    exercises: Array<{ id: string; type: 'exercise_template' | 'group' }>;
  };
  type DatabaseSchedule = DatabaseScheduleDay[][];

  const dbSchedule = schedule as DatabaseSchedule | null;

  if (!dbSchedule || dbSchedule.length === 0) {
    return {
      success: true as const,
      data: [],
    };
  }

  // Extract all IDs from schedule
  const exerciseTemplateIds = new Set<string>();
  const groupIds = new Set<string>();

  for (const week of dbSchedule) {
    for (const day of week) {
      for (const exercise of day.exercises) {
        if (exercise.type === 'exercise_template') {
          exerciseTemplateIds.add(exercise.id);
        } else if (exercise.type === 'group') {
          groupIds.add(exercise.id);
        }
      }
    }
  }

  const client = await createClient();
  const groupsQuery = new GroupsQuery();

  const [directTemplatesResult, groupsResult] = await Promise.all([
    query(
      getExerciseTemplatesByIdsQuery,
      Array.from(exerciseTemplateIds),
      { client },
    ),
    groupsQuery.getByIds(Array.from(groupIds)),
  ]);

  const [directTemplatesErr, directTemplatesRecord] = directTemplatesResult;
  if (directTemplatesErr) {
    return { success: false, error: formatDalError(directTemplatesErr) };
  }

  if (!groupsResult.success) {
    return { success: false, error: groupsResult.error };
  }

  const groupsMap = groupsResult.data;
  const templatesMap = new Map<string, ExerciseTemplate>(
    Object.entries(directTemplatesRecord) as [string, ExerciseTemplate][],
  );

  const groupOnlyTemplateIds = new Set<string>();
  for (const group of groupsMap.values()) {
    for (const id of group.exercise_template_ids ?? []) {
      if (!templatesMap.has(id)) {
        groupOnlyTemplateIds.add(id);
      }
    }
  }

  if (groupOnlyTemplateIds.size > 0) {
    const [groupTemplatesErr, groupTemplatesRecord] = await query(
      getExerciseTemplatesByIdsQuery,
      Array.from(groupOnlyTemplateIds),
      { client },
    );

    if (groupTemplatesErr) {
      return { success: false, error: formatDalError(groupTemplatesErr) };
    }

    for (const [id, template] of Object.entries(groupTemplatesRecord) as [
      string,
      ExerciseTemplate,
    ][]) {
      templatesMap.set(id, template);
    }
  }

  // Convert schedule to SelectedItem format
  const convertedSchedule: SelectedItem[][][] = [];

  for (const week of dbSchedule) {
    const convertedWeek: SelectedItem[][] = [];

    for (const day of week) {
      const convertedDay: SelectedItem[] = [];

      for (const exercise of day.exercises) {
        if (exercise.type === 'exercise_template') {
          const template = templatesMap.get(exercise.id);
          if (template) {
            convertedDay.push({
              type: 'template',
              data: template as ExerciseTemplate,
            });
          }
        } else if (exercise.type === 'group') {
          const group = groupsMap.get(exercise.id);
          if (group) {
            // Fetch exercise templates for this group
            const groupTemplates: Array<
              Extract<SelectedItem, { type: 'template' }>
            > = [];
            if (
              group.exercise_template_ids &&
              group.exercise_template_ids.length > 0
            ) {
              for (const templateId of group.exercise_template_ids) {
                const template = templatesMap.get(templateId);
                if (template) {
                  groupTemplates.push({
                    type: 'template',
                    data: template as ExerciseTemplate,
                  });
                }
              }
            }

            const groupData: Group = {
              id: group.id,
              name: group.title,
              isSuperset: group.is_superset || false,
              items: groupTemplates,
            };
            const selectedItem: SelectedItem = {
              type: 'group',
              data: groupData,
            };
            convertedDay.push(selectedItem);
          }
        }
      }

      convertedWeek.push(convertedDay);
    }

    convertedSchedule.push(convertedWeek);
  }

  return {
    success: true as const,
    data: convertedSchedule,
  };
}

/**
 * Update workout schedule for derived active assignments
 * @param baseAssignmentId - The base template assignment ID
 * @param workoutScheduleId - The new workout schedule ID
 * @returns Success with count of updated assignments or error
 */
export async function updateDerivedProgramSchedules(
  baseAssignmentId: string,
  workoutScheduleId: string,
) {
  const query = new ProgramAssignmentsQuery();
  return query.updateDerivedAssignmentsSchedule(
    baseAssignmentId,
    workoutScheduleId,
    PROGRAM_ASSIGNMENT_STATUS.ACTIVE,
  );
}

/**
 * Update workout schedule for derived pre-program user assignments.
 */
export async function updateDerivedPreProgramSchedules(
  baseAssignmentId: string,
  workoutScheduleId: string,
) {
  const query = new ProgramAssignmentsQuery();
  return query.updateDerivedAssignmentsSchedule(
    baseAssignmentId,
    workoutScheduleId,
    PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM,
  );
}
