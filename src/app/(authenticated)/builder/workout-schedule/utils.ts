import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import type {
  ExerciseTemplate,
  Group,
} from '@/lib/supabase/schemas/exercise-templates';
import { ExerciseTemplatesQuery } from '@/lib/supabase/queries/exercise-templates';
import { GroupsQuery } from '@/lib/supabase/queries/groups';
import type { Group as GroupType } from '@/lib/supabase/queries/groups';

/**
 * Database schedule format: {exercises: [{id: string, type: "exercise_template" | "group"}]}[][]
 */
type DatabaseScheduleDay = {
  exercises: Array<{ id: string; type: 'exercise_template' | 'group' }>;
};

type DatabaseSchedule = DatabaseScheduleDay[][];

/**
 * Merge base schedule with patient override
 * Only replaces base schedule items if override has exercises (length > 0)
 */
export function mergeScheduleWithOverride(
  baseSchedule: DatabaseSchedule | null,
  patientOverride: DatabaseSchedule | null | undefined,
): DatabaseSchedule {
  // If no base schedule, return empty or override if exists
  if (!baseSchedule) {
    return patientOverride || [];
  }

  // If no override, return base schedule
  if (!patientOverride) {
    return baseSchedule;
  }

  // Create a deep copy of base schedule
  const merged: DatabaseSchedule = baseSchedule.map((week) =>
    week.map((day) => ({ ...day, exercises: [...day.exercises] })),
  );

  // Merge override into base schedule
  for (let weekIndex = 0; weekIndex < patientOverride.length; weekIndex++) {
    const overrideWeek = patientOverride[weekIndex];
    if (!overrideWeek) continue;

    // Ensure merged schedule has enough weeks
    while (merged.length <= weekIndex) {
      merged.push([]);
    }

    for (let dayIndex = 0; dayIndex < overrideWeek.length; dayIndex++) {
      const overrideDay = overrideWeek[dayIndex];
      if (!overrideDay) continue;

      // Only replace if override has exercises (ignore empty arrays)
      if (overrideDay.exercises && overrideDay.exercises.length > 0) {
        // Ensure week has enough days
        while (merged[weekIndex].length <= dayIndex) {
          merged[weekIndex].push({ exercises: [] });
        }

        // Replace with override
        merged[weekIndex][dayIndex] = {
          exercises: [...overrideDay.exercises],
        };
      }
    }
  }

  return merged;
}

/**
 * Extract all unique IDs from schedule (both exercise_template and group IDs)
 */
function extractIdsFromSchedule(schedule: DatabaseSchedule): {
  exerciseTemplateIds: string[];
  groupIds: string[];
} {
  const exerciseTemplateIds = new Set<string>();
  const groupIds = new Set<string>();

  for (const week of schedule) {
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

  return {
    exerciseTemplateIds: Array.from(exerciseTemplateIds),
    groupIds: Array.from(groupIds),
  };
}

/**
 * Convert database group to SelectedItem Group format
 * Fetches exercise templates for the group
 */
async function convertGroupToSelectedItem(
  groupId: string,
  groupsMap: Map<string, GroupType>,
  templatesMap: Map<string, ExerciseTemplate>,
): Promise<SelectedItem | null> {
  const group = groupsMap.get(groupId);
  if (!group) {
    return null;
  }

  // Fetch exercise templates for this group
  const groupTemplates: SelectedItem[] = [];
  if (group.exercise_template_ids && group.exercise_template_ids.length > 0) {
    for (const templateId of group.exercise_template_ids) {
      const template = templatesMap.get(templateId);
      if (template) {
        groupTemplates.push({
          type: 'template',
          data: template,
        });
      }
    }
  }

  // Convert to Group format expected by SelectedItem
  const selectedGroup: Group = {
    name: group.title,
    isSuperset: group.is_superset || false,
    items: groupTemplates,
  };

  return {
    type: 'group',
    data: selectedGroup,
  };
}

/**
 * Convert database schedule format to SelectedItem[][][] format
 * Fetches all required ExerciseTemplate and Group data
 */
export async function convertScheduleToSelectedItems(
  schedule: DatabaseSchedule,
): Promise<SelectedItem[][][]> {
  if (!schedule || schedule.length === 0) {
    return [];
  }

  // Extract all IDs from schedule
  const { exerciseTemplateIds, groupIds } = extractIdsFromSchedule(schedule);

  // Fetch all exercise templates and groups in parallel
  const templatesQuery = new ExerciseTemplatesQuery();
  const groupsQuery = new GroupsQuery();

  const [templatesResult, groupsResult] = await Promise.all([
    exerciseTemplateIds.length > 0
      ? templatesQuery.getByIds(exerciseTemplateIds)
      : Promise.resolve({ success: true as const, data: new Map() }),
    groupIds.length > 0
      ? groupsQuery.getByIds(groupIds)
      : Promise.resolve({ success: true as const, data: new Map() }),
  ]);

  if (!templatesResult.success) {
    throw new Error(
      templatesResult.error || 'Failed to fetch exercise templates',
    );
  }

  if (!groupsResult.success) {
    throw new Error(groupsResult.error || 'Failed to fetch groups');
  }

  const templatesMap = templatesResult.data;
  const groupsMap = groupsResult.data;

  // Convert schedule to SelectedItem format
  const convertedSchedule: SelectedItem[][][] = [];

  for (const week of schedule) {
    const convertedWeek: SelectedItem[][] = [];

    for (const day of week) {
      const convertedDay: SelectedItem[] = [];

      for (const exercise of day.exercises) {
        if (exercise.type === 'exercise_template') {
          const template = templatesMap.get(exercise.id);
          if (template) {
            convertedDay.push({
              type: 'template',
              data: template,
            });
          }
          // If template not found, skip it (edge case handling)
        } else if (exercise.type === 'group') {
          const groupItem = await convertGroupToSelectedItem(
            exercise.id,
            groupsMap,
            templatesMap,
          );
          if (groupItem) {
            convertedDay.push(groupItem);
          }
          // If group not found, skip it (edge case handling)
        }
      }

      convertedWeek.push(convertedDay);
    }

    convertedSchedule.push(convertedWeek);
  }

  return convertedSchedule;
}
