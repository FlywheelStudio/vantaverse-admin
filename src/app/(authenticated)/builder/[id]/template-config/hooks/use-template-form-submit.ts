'use client';

import { useUpdateExerciseTemplate } from '@/hooks/use-exercise-template-mutations';
import type { TemplateFormData } from '../schemas';
import type { SelectedItem } from '../types';
import { formatValueWithUnit } from '../utils';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';

type ValidTemplateItem = Exclude<SelectedItem, { type: 'group' }>;

const isValidTemplateItem = (
  item: SelectedItem | null,
): item is ValidTemplateItem => {
  return item !== null && item.type !== 'group';
};

const getExerciseId = (item: ValidTemplateItem): number => {
  return item.type === 'exercise' ? item.data.id : item.data.exercise_id;
};

function buildMergedTemplate(
  item: ValidTemplateItem,
  variables: {
    exerciseId: number;
    sets?: number;
    rep?: number;
    time?: number;
    distance?: string;
    weight?: string;
    rest_time?: number;
    tempo?: string[];
    rep_override?: number[];
    time_override?: number[];
    distance_override?: string[];
    weight_override?: string[];
    rest_time_override?: number[];
  },
  data: { id: string; template_hash: string },
): ExerciseTemplate {
  const base: Partial<ExerciseTemplate> =
    item.type === 'template'
      ? { ...item.data }
      : {
          exercise_id: item.data.id,
          exercise_name: item.data.exercise_name,
          video_type: item.data.video_type,
          video_url: item.data.video_url ?? null,
        };
  return {
    id: data.id,
    template_hash: data.template_hash,
    exercise_id: variables.exerciseId,
    exercise_name: base.exercise_name ?? '',
    video_type: base.video_type,
    video_url: base.video_url ?? null,
    notes: base.notes ?? null,
    sets: variables.sets ?? base.sets ?? null,
    rep: variables.rep ?? base.rep ?? null,
    time: variables.time ?? base.time ?? null,
    distance: variables.distance ?? base.distance ?? null,
    weight: variables.weight ?? base.weight ?? null,
    rest_time: variables.rest_time ?? base.rest_time ?? null,
    tempo: variables.tempo ?? base.tempo ?? null,
    equipment_ids: base.equipment_ids ?? null,
    rep_override: variables.rep_override ?? base.rep_override ?? null,
    time_override: variables.time_override ?? base.time_override ?? null,
    distance_override:
      variables.distance_override ?? base.distance_override ?? null,
    weight_override: variables.weight_override ?? base.weight_override ?? null,
    rest_time_override:
      variables.rest_time_override ?? base.rest_time_override ?? null,
    created_at: base.created_at ?? null,
    updated_at: base.updated_at ?? null,
  } as ExerciseTemplate;
}

interface UseTemplateFormSubmitProps {
  item: SelectedItem | null;
  onSuccess?: () => void;
  onMutate?: (data: Partial<TemplateFormData>) => void;
  onSuccessWithTemplate?: (template: ExerciseTemplate) => void;
}

export function useTemplateFormSubmit({
  item,
  onSuccess,
  onMutate,
  onSuccessWithTemplate,
}: UseTemplateFormSubmitProps) {
  const updateMutation = useUpdateExerciseTemplate({
    onSuccess: (data) => {
      if (
        onSuccessWithTemplate &&
        item &&
        isValidTemplateItem(item) &&
        data?.id &&
        data?.template_hash
      ) {
        const variables = updateMutation.variables;
        if (variables) {
          const merged = buildMergedTemplate(item, variables, data);
          onSuccessWithTemplate(merged);
        }
      }
      onSuccess?.();
    },
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
