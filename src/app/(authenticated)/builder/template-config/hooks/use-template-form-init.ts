'use client';

import { useEffect } from 'react';
import { UseFormReset } from 'react-hook-form';
import { startTransition } from 'react';
import type { SelectedItem } from '../types';
import type { TemplateFormData } from '../schemas';
import { parseValueWithUnit } from '../utils';
import { TemplateConfigDefaultValues } from '../template-config';

type ValidTemplateItem = Exclude<SelectedItem, { type: 'group' }>;

const isValidTemplateItem = (
  item: SelectedItem | null,
): item is ValidTemplateItem => {
  return item !== null && item.type !== 'group';
};

const getDefaultFormData = (): TemplateFormData => ({
  sets: TemplateConfigDefaultValues.sets,
  rep: TemplateConfigDefaultValues.rep,
  time: TemplateConfigDefaultValues.time,
  distance: null,
  distanceUnit: 'm',
  weight: null,
  weightUnit: 'kg',
  rest_time: TemplateConfigDefaultValues.rest_time,
  tempo: [null, null, null, null],
  rep_override: [],
  time_override: [],
  distance_override: [],
  distance_override_units: [],
  weight_override: [],
  weight_override_units: [],
  rest_time_override: [],
});

function initializeFormData(item: ValidTemplateItem | null): TemplateFormData {
  if (!item || item.type === 'exercise') {
    return getDefaultFormData();
  }

  const template = item.data;
  const sets = template.sets || 1;
  const distanceParsed = parseValueWithUnit(template.distance);
  const weightParsed = parseValueWithUnit(template.weight);

  const distanceOverrides = (template.distance_override || []).map((d) =>
    parseValueWithUnit(d),
  );
  const weightOverrides = (template.weight_override || []).map((w) =>
    parseValueWithUnit(w),
  );

  // Parse tempo from template (string[] of length 4)
  const tempo = template.tempo
    ? Array(4)
        .fill(null)
        .map((_, i) => template.tempo?.[i] ?? null)
    : [null, null, null, null];

  return {
    sets,
    rep: template.rep ?? null,
    time: template.time ?? null,
    distance: distanceParsed.value,
    distanceUnit: distanceParsed.unit || 'm',
    weight: weightParsed.value,
    weightUnit: weightParsed.unit || 'kg',
    rest_time: template.rest_time ?? null,
    tempo,
    rep_override: Array(sets)
      .fill(null)
      .map((_, i) => template.rep_override?.[i] ?? null),
    time_override: Array(sets)
      .fill(null)
      .map((_, i) => template.time_override?.[i] ?? null),
    distance_override: Array(sets)
      .fill(null)
      .map((_, i) => distanceOverrides[i]?.value ?? null),
    distance_override_units: Array(sets)
      .fill(null)
      .map((_, i) => distanceOverrides[i]?.unit || 'm'),
    weight_override: Array(sets)
      .fill(null)
      .map((_, i) => weightOverrides[i]?.value ?? null),
    weight_override_units: Array(sets)
      .fill(null)
      .map((_, i) => weightOverrides[i]?.unit || 'kg'),
    rest_time_override: Array(sets)
      .fill(null)
      .map((_, i) => template.rest_time_override?.[i] ?? null),
  };
}

interface UseTemplateFormInitProps {
  item: SelectedItem | null;
  reset: UseFormReset<TemplateFormData>;
}

export function useTemplateFormInit({
  item,
  reset,
}: UseTemplateFormInitProps) {
  useEffect(() => {
    const newFormData = initializeFormData(
      isValidTemplateItem(item) ? item : null,
    );
    startTransition(() => {
      reset(newFormData);
    });
  }, [item, reset]);
}
