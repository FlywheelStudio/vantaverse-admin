'use client';

import { useUpdateExerciseTemplate } from '@/hooks/use-exercise-template-mutations';
import type { TemplateFormData } from '../schemas';
import type { SelectedItem } from '../types';
import { formatValueWithUnit } from '../utils';

type ValidTemplateItem = Exclude<SelectedItem, { type: 'group' }>;

const isValidTemplateItem = (
  item: SelectedItem | null,
): item is ValidTemplateItem => {
  return item !== null && item.type !== 'group';
};

const getExerciseId = (item: ValidTemplateItem): number => {
  return item.type === 'exercise' ? item.data.id : item.data.exercise_id;
};

interface UseTemplateFormSubmitProps {
  item: SelectedItem | null;
  onSuccess?: () => void;
  onMutate?: (data: Partial<TemplateFormData>) => void;
}

export function useTemplateFormSubmit({
  item,
  onSuccess,
  onMutate,
}: UseTemplateFormSubmitProps) {
  const updateMutation = useUpdateExerciseTemplate({
    onSuccess,
  });

  const onSubmit = async (data: TemplateFormData) => {
    if (!isValidTemplateItem(item)) return;

    const exerciseId = getExerciseId(item);

    const distanceValue = formatValueWithUnit(
      data.distance,
      data.distanceUnit,
    );
    const weightValue = formatValueWithUnit(data.weight, data.weightUnit);

    const distanceOverrides = data.distance_override.map((val, idx) =>
      formatValueWithUnit(val, data.distance_override_units[idx] || 'm'),
    );

    const weightOverrides = data.weight_override.map((val, idx) =>
      formatValueWithUnit(val, data.weight_override_units[idx] || 'kg'),
    );

    const repOverrides: number[] = data.rep_override.map((v) =>
      v !== null && v !== undefined ? v : -1,
    );
    const timeOverrides: number[] = data.time_override.map((v) =>
      v !== null && v !== undefined ? v : -1,
    );
    const distanceOverridesFormatted: string[] = distanceOverrides.map(
      (v) => v ?? '-1',
    );
    const weightOverridesFormatted: string[] = weightOverrides.map(
      (v) => v ?? '-1',
    );
    const restTimeOverrides: number[] = data.rest_time_override.map(
      (v) => (v !== null && v !== undefined ? v : -1),
    );

    const hasRepOverrides = repOverrides.some((v) => v !== -1);
    const hasTimeOverrides = timeOverrides.some((v) => v !== -1);
    const hasDistanceOverrides = distanceOverridesFormatted.some(
      (v) => v !== '-1',
    );
    const hasWeightOverrides = weightOverridesFormatted.some(
      (v) => v !== '-1',
    );
    const hasRestTimeOverrides = restTimeOverrides.some((v) => v !== -1);

    // Format tempo: convert to string[] of length 4, filter out nulls but maintain array length
    const tempoFormatted: string[] = data.tempo.map((v) => v ?? '');
    const hasTempo = tempoFormatted.some((v) => v !== '');

    // Call onMutate callback for optimistic UI updates
    onMutate?.(data);

    updateMutation.mutate({
      exerciseId,
      sets: data.sets ?? undefined,
      rep: data.rep ?? undefined,
      time: data.time ?? undefined,
      distance: distanceValue ?? undefined,
      weight: weightValue ?? undefined,
      rest_time: data.rest_time ?? undefined,
      tempo: hasTempo ? tempoFormatted : undefined,
      rep_override: hasRepOverrides ? repOverrides : undefined,
      time_override: hasTimeOverrides ? timeOverrides : undefined,
      distance_override: hasDistanceOverrides
        ? distanceOverridesFormatted
        : undefined,
      weight_override: hasWeightOverrides
        ? weightOverridesFormatted
        : undefined,
      rest_time_override: hasRestTimeOverrides ? restTimeOverrides : undefined,
    });
  };

  return {
    onSubmit,
    isSubmitting: updateMutation.isPending,
  };
}
