'use server';

import { ProgramTemplatesQuery } from '@/lib/supabase/queries/program-templates';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { ExercisesQuery } from '@/lib/supabase/queries/exercises';
import { ExerciseTemplatesQuery } from '@/lib/supabase/queries/exercise-templates';
import { GroupsQuery } from '@/lib/supabase/queries/groups';
import { WorkoutSchedulesQuery } from '@/lib/supabase/queries/workout-schedules';
import { SupabaseStorage } from '@/lib/supabase/storage';
import { DatabaseSchedule } from './workout-schedule/utils';
import type { Group } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';

/**
 * Get all program assignments with status='template' (joined with program_template)
 */
export async function getProgramAssignments() {
  const query = new ProgramAssignmentsQuery();
  return query.getTemplates();
}

/**
 * Get a single program template by ID
 */
export async function getProgramTemplateById(id: string) {
  const query = new ProgramTemplatesQuery();
  return query.getById(id);
}

/**
 * Create a new program template and program assignment
 */
export async function createProgramTemplate(
  name: string,
  weeks: number,
  startDate: string,
  description?: string | null,
  goals?: string | null,
  notes?: string | null,
  organizationId?: string | null,
) {
  const templateQuery = new ProgramTemplatesQuery();
  const assignmentQuery = new ProgramAssignmentsQuery();

  // Create program_template first
  const templateResult = await templateQuery.create(
    name,
    weeks,
    description,
    goals,
    notes,
    organizationId,
  );

  if (!templateResult.success) {
    return templateResult;
  }

  const templateId = templateResult.data.id;

  // Calculate end date from start date + weeks
  const start = new Date(startDate);
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + weeks * 7);
  const endDateString = endDate.toISOString().split('T')[0];

  // Create program_assignment with status='template'
  const assignmentResult = await assignmentQuery.create(
    templateId,
    startDate,
    endDateString,
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
  oldImageUrl?: string | null,
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
    const urlParts = oldImageUrl.split('/');
    const oldPathIndex = urlParts.findIndex((part) =>
      part.includes('program-templates'),
    );
    if (oldPathIndex !== -1) {
      const oldPath = urlParts.slice(oldPathIndex - 1).join('/');
      await storage.delete('organization_assets', oldPath);
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
  const templateQuery = new ProgramTemplatesQuery();

  // Get the assignment to find the template ID
  const assignmentResult = await assignmentQuery.getById(assignmentId);

  if (!assignmentResult.success) {
    return assignmentResult;
  }

  const templateId = assignmentResult.data.program_template?.id;

  if (!templateId) {
    return {
      success: false as const,
      error: 'Template ID not found',
    };
  }

  // Delete the template - this will cascade delete the assignment
  const deleteTemplateResult = await templateQuery.delete(templateId);

  if (!deleteTemplateResult.success) {
    return deleteTemplateResult;
  }

  return {
    success: true as const,
    data: undefined,
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
) {
  const templateQuery = new ProgramTemplatesQuery();

  // Update program_template
  const updateResult = await templateQuery.update(templateId, {
    name: name.trim(),
    weeks,
    description: description?.trim() || null,
    goals: goals?.trim() || null,
    notes: notes?.trim() || null,
  });

  if (!updateResult.success) {
    return updateResult;
  }

  // Update assignment dates if provided
  if (startDate && endDate) {
    const assignmentQuery = new ProgramAssignmentsQuery();
    const updateDatesResult = await assignmentQuery.updateDatesByTemplateId(
      templateId,
      startDate,
      endDate,
    );

    if (!updateDatesResult.success) {
      return updateDatesResult;
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
) {
  const query = new ProgramTemplatesQuery();
  return query.update(templateId, { image_url: imageUrl as unknown });
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
) {
  const query = new ExercisesQuery();
  return query.getListPaginated(page, pageSize, search, sortBy, sortOrder);
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
  const query = new ExerciseTemplatesQuery();
  return query.getListPaginated(page, pageSize, search, sortBy, sortOrder);
}

/**
 * Upsert exercise template via RPC function
 */
export async function upsertExerciseTemplate(data: {
  p_exercise_id: number;
  p_sets?: number;
  p_rep?: number;
  p_time?: number;
  p_distance?: string;
  p_weight?: string;
  p_rest_time?: number;
  p_rep_override?: number[];
  p_time_override?: number[];
  p_distance_override?: string[];
  p_weight_override?: string[];
  p_rest_time_override?: number[];
  p_equipment_ids?: number[];
  p_notes?: string;
}) {
  const query = new ExerciseTemplatesQuery();
  return query.upsertExerciseTemplate(data);
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
 * Get program assignment by program template ID
 */
export async function getProgramAssignmentByTemplateId(templateId: string) {
  const query = new ProgramAssignmentsQuery();
  return query.getByTemplateId(templateId);
}

/**
 * Upsert workout schedule via RPC function
 */
export async function upsertWorkoutSchedule(
  schedule: DatabaseSchedule,
  isDraft: boolean = true,
  notes?: string,
) {
  const query = new WorkoutSchedulesQuery();
  return query.upsertWorkoutSchedule(schedule, isDraft, notes);
}

/**
 * Get workout schedule data for a program assignment
 * Fetches program_assignment with patient_override and workout_schedules.schedule
 */
export async function getWorkoutScheduleData(programAssignmentId: string) {
  const query = new WorkoutSchedulesQuery();
  const result = await query.getScheduleDataByAssignmentId(programAssignmentId);

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
 * Update program assignment workout schedule ID (only if currently null)
 */
export async function updateProgramAssignmentWorkoutSchedule(
  assignmentId: string,
  workoutScheduleId: string,
) {
  const query = new ProgramAssignmentsQuery();
  return query.updateWorkoutScheduleId(assignmentId, workoutScheduleId);
}

/**
 * Update program assignment workout schedule ID (always updates, even if already set)
 */
export async function updateProgramSchedule(
  assignmentId: string,
  workoutScheduleId: string,
) {
  const query = new ProgramAssignmentsQuery();
  return query.updateWorkoutScheduleIdAlways(assignmentId, workoutScheduleId);
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

  // Fetch all exercise templates and groups in parallel
  const templatesQuery = new ExerciseTemplatesQuery();
  const groupsQuery = new GroupsQuery();

  const [templatesResult, groupsResult] = await Promise.all([
    exerciseTemplateIds.size > 0
      ? templatesQuery.getByIds(Array.from(exerciseTemplateIds))
      : Promise.resolve({ success: true as const, data: new Map() }),
    groupIds.size > 0
      ? groupsQuery.getByIds(Array.from(groupIds))
      : Promise.resolve({ success: true as const, data: new Map() }),
  ]);

  if (!templatesResult.success) {
    return {
      success: false as const,
      error: templatesResult.error || 'Failed to fetch exercise templates',
    };
  }

  if (!groupsResult.success) {
    return {
      success: false as const,
      error: groupsResult.error || 'Failed to fetch groups',
    };
  }

  const templatesMap = templatesResult.data;
  const groupsMap = groupsResult.data;

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
