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
    rep?: number | null;
    time?: number | null;
    distance?: string | null;
    weight?: string | null;
    rest_time?: number | null;
    tempo?: string[] | null;
    rep_override?: number[] | null;
    time_override?: number[] | null;
    distance_override?: string[] | null;
    weight_override?: string[] | null;
    rest_time_override?: number[] | null;
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
  const v = variables;
  const b = base;
  return {
    id: data.id,
    template_hash: data.template_hash,
    exercise_id: variables.exerciseId,
    exercise_name: base.exercise_name ?? '',
    video_type: base.video_type,
    video_url: base.video_url ?? null,
    notes: base.notes ?? null,
    sets: v.sets ?? b.sets ?? null,
    rep: v.rep !== undefined ? v.rep : (b.rep ?? null),
    time: v.time !== undefined ? v.time : (b.time ?? null),
    distance: v.distance !== undefined ? v.distance : (b.distance ?? null),
    weight: v.weight !== undefined ? v.weight : (b.weight ?? null),
    rest_time: v.rest_time !== undefined ? v.rest_time : (b.rest_time ?? null),
    tempo: v.tempo !== undefined ? v.tempo : (b.tempo ?? null),
    equipment_ids: base.equipment_ids ?? null,
    rep_override:
      v.rep_override !== undefined ? v.rep_override : (b.rep_override ?? null),
    time_override:
      v.time_override !== undefined
        ? v.time_override
        : (b.time_override ?? null),
    distance_override:
      v.distance_override !== undefined
        ? v.distance_override
        : (b.distance_override ?? null),
    weight_override:
      v.weight_override !== undefined
        ? v.weight_override
        : (b.weight_override ?? null),
    rest_time_override:
      v.rest_time_override !== undefined
        ? v.rest_time_override
        : (b.rest_time_override ?? null),
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

    const distanceValue = formatValueWithUnit(data.distance, data.distanceUnit);
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
    const restTimeOverrides: number[] = data.rest_time_override.map((v) =>
      v !== null && v !== undefined ? v : -1,
    );

    const hasRepOverrides = repOverrides.some((v) => v !== -1);
    const hasTimeOverrides = timeOverrides.some((v) => v !== -1);
    const hasDistanceOverrides = distanceOverridesFormatted.some(
      (v) => v !== '-1',
    );
    const hasWeightOverrides = weightOverridesFormatted.some((v) => v !== '-1');
    const hasRestTimeOverrides = restTimeOverrides.some((v) => v !== -1);

    // Format tempo: convert to string[] of length 4, filter out nulls but maintain array length
    const tempoFormatted: string[] = data.tempo.map((v) => v ?? '');
    const hasTempo = tempoFormatted.some((v) => v !== '');

    // Call onMutate callback for optimistic UI updates
    onMutate?.(data);

    updateMutation.mutate({
      exerciseId,
      sets: data.sets ?? undefined,
      rep: data.rep,
      time: data.time,
      distance: distanceValue,
      weight: weightValue,
      rest_time: data.rest_time,
      tempo: hasTempo ? tempoFormatted : null,
      rep_override: hasRepOverrides ? repOverrides : null,
      time_override: hasTimeOverrides ? timeOverrides : null,
      distance_override: hasDistanceOverrides
        ? distanceOverridesFormatted
        : null,
      weight_override: hasWeightOverrides ? weightOverridesFormatted : null,
      rest_time_override: hasRestTimeOverrides ? restTimeOverrides : null,
    });
  };

  return {
    onSubmit,
    isSubmitting: updateMutation.isPending,
  };
}
