import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';

/**
 * Get the value for a specific set index, using override if available, otherwise base value
 */
function getSetValue(
  baseValue: number | string | null,
  overrideArray: (number | string)[] | null,
  setIndex: number,
): number | string | null {
  if (overrideArray && overrideArray[setIndex] !== undefined) {
    const overrideValue = overrideArray[setIndex];
    // -1 means use default base value
    if (overrideValue === -1 || overrideValue === '-1') {
      return baseValue;
    }
    return overrideValue;
  }
  return baseValue;
}

/**
 * Format a value for display
 */
function formatValue(value: number | string | null, unit: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  return `${value}${unit}`;
}

/**
 * Generate a description for an exercise template showing sets, reps, time, distance, weight, and rest_time
 * with override values per set
 */
export function generateExerciseTemplateDescription(
  template: ExerciseTemplate,
): string {
  const sets = template.sets || 0;
  if (sets === 0) {
    return 'No sets configured';
  }

  const parts: string[] = [`${sets} set${sets !== 1 ? 's' : ''}`];

  const setDescriptions: string[] = [];

  for (let i = 0; i < sets; i++) {
    const setParts: string[] = [`Set ${i + 1}`];

    // Get values for this set (using override if available)
    const reps = getSetValue(template.rep, template.rep_override, i) as
      | number
      | null;
    const time = getSetValue(template.time, template.time_override, i) as
      | number
      | null;
    const distance = getSetValue(
      template.distance,
      template.distance_override,
      i,
    ) as string | null;
    const weight = getSetValue(template.weight, template.weight_override, i) as
      | string
      | null;
    const restTime = getSetValue(
      template.rest_time,
      template.rest_time_override,
      i,
    ) as number | null;

    // Build set description
    const setValues: string[] = [];

    if (reps !== null && reps !== undefined) {
      setValues.push(formatValue(reps, ' reps'));
    }
    if (time !== null && time !== undefined) {
      setValues.push(formatValue(time, 's'));
    }
    if (distance !== null && distance !== undefined && distance !== '') {
      setValues.push(formatValue(distance, ''));
    }
    if (weight !== null && weight !== undefined && weight !== '') {
      setValues.push(formatValue(weight, ''));
    }
    if (restTime !== null && restTime !== undefined) {
      setValues.push(formatValue(restTime, 's rest'));
    }

    if (setValues.length > 0) {
      setParts.push(` - ${setValues.join(', ')}`);
      setDescriptions.push(setParts.join(''));
    } else {
      setDescriptions.push(`Set ${i + 1}`);
    }
  }

  if (setDescriptions.length > 0) {
    parts.push(`: ${setDescriptions.join(' | ')}`);
  }

  return parts.join('');
}
