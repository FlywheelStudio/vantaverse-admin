import { useState, useEffect, useRef, startTransition } from 'react';
import type { SelectedItem } from '../types';
import type { TemplateFormData, TabType } from '../types';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import { parseValueWithUnit, formatValueWithUnit } from '../utils';
import { TemplateConfigDefaultValues } from '../template-config';

type ValidTemplateItem = Exclude<SelectedItem, { type: 'group' }>;

const isValidTemplateItem = (
  item: SelectedItem | null,
): item is ValidTemplateItem => {
  return item !== null && item.type !== 'group';
};

const getExerciseId = (item: ValidTemplateItem): number => {
  return item.type === 'exercise' ? item.data.id : item.data.exercise_id;
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

export function useTemplateForm(
  item: SelectedItem | null,
  onSave: (data: Partial<ExerciseTemplate>) => Promise<void>,
  onClose: () => void,
  copiedData: Partial<ExerciseTemplate> | null,
) {
  const [formData, setFormData] = useState<TemplateFormData>(() =>
    initializeFormData(isValidTemplateItem(item) ? item : null),
  );
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newFormData = initializeFormData(
      isValidTemplateItem(item) ? item : null,
    );
    startTransition(() => {
      setFormData(newFormData);
      setActiveTab('all');
      setCurrentSetIndex(0);
    });

    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [item]);

  const handleSetsChange = (newSets: number) => {
    if (newSets < 1) return;
    const currentSets = formData.sets;
    setFormData((prev) => {
      const updated = { ...prev, sets: newSets };

      if (newSets > currentSets) {
        updated.rep_override = [
          ...prev.rep_override,
          ...Array(newSets - currentSets).fill(null),
        ];
        updated.time_override = [
          ...prev.time_override,
          ...Array(newSets - currentSets).fill(null),
        ];
        updated.distance_override = [
          ...prev.distance_override,
          ...Array(newSets - currentSets).fill(null),
        ];
        updated.distance_override_units = [
          ...prev.distance_override_units,
          ...Array(newSets - currentSets).fill('m'),
        ];
        updated.weight_override = [
          ...prev.weight_override,
          ...Array(newSets - currentSets).fill(null),
        ];
        updated.weight_override_units = [
          ...prev.weight_override_units,
          ...Array(newSets - currentSets).fill('kg'),
        ];
        updated.rest_time_override = [
          ...prev.rest_time_override,
          ...Array(newSets - currentSets).fill(null),
        ];
      } else {
        updated.rep_override = prev.rep_override.slice(0, newSets);
        updated.time_override = prev.time_override.slice(0, newSets);
        updated.distance_override = prev.distance_override.slice(0, newSets);
        updated.distance_override_units = prev.distance_override_units.slice(
          0,
          newSets,
        );
        updated.weight_override = prev.weight_override.slice(0, newSets);
        updated.weight_override_units = prev.weight_override_units.slice(
          0,
          newSets,
        );
        updated.rest_time_override = prev.rest_time_override.slice(0, newSets);
      }

      if (currentSetIndex >= newSets) {
        setCurrentSetIndex(Math.max(0, newSets - 1));
      }

      return updated;
    });
  };

  const setCurrentValue = (
    field: 'rep' | 'time' | 'rest_time' | 'distance' | 'weight',
    value: number | string | null,
  ) => {
    if (activeTab === 'all') {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      const overrideFieldMap: Record<string, keyof TemplateFormData> = {
        rep: 'rep_override',
        time: 'time_override',
        rest_time: 'rest_time_override',
        distance: 'distance_override',
        weight: 'weight_override',
      };
      const overrideField = overrideFieldMap[field];
      if (!overrideField) return;

      setFormData((prev) => {
        const updated = { ...prev };
        const overrideArray = [
          ...(updated[overrideField] as (number | string | null)[]),
        ];
        overrideArray[currentSetIndex] = value;
        return {
          ...updated,
          [overrideField]:
            overrideArray as (typeof updated)[typeof overrideField],
        };
      });
    }
  };

  const handleBlur = async (
    modalRef: React.RefObject<HTMLDivElement | null>,
  ) => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    blurTimeoutRef.current = setTimeout(async () => {
      const activeElement = document.activeElement;
      if (
        modalRef.current &&
        activeElement &&
        modalRef.current.contains(activeElement)
      ) {
        return;
      }

      if (!isValidTemplateItem(item)) return;

      const exerciseId = getExerciseId(item);

      const distanceValue = formatValueWithUnit(
        formData.distance,
        formData.distanceUnit,
      );
      const weightValue = formatValueWithUnit(
        formData.weight,
        formData.weightUnit,
      );

      const distanceOverrides = formData.distance_override.map((val, idx) =>
        formatValueWithUnit(val, formData.distance_override_units[idx] || 'm'),
      );

      const weightOverrides = formData.weight_override.map((val, idx) =>
        formatValueWithUnit(val, formData.weight_override_units[idx] || 'kg'),
      );

      const repOverrides: number[] = formData.rep_override.map((v) =>
        v !== null && v !== undefined ? v : -1,
      );
      const timeOverrides: number[] = formData.time_override.map((v) =>
        v !== null && v !== undefined ? v : -1,
      );
      const distanceOverridesFormatted: string[] = distanceOverrides.map(
        (v) => v ?? '-1',
      );
      const weightOverridesFormatted: string[] = weightOverrides.map(
        (v) => v ?? '-1',
      );
      const restTimeOverrides: number[] = formData.rest_time_override.map(
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
      const tempoFormatted: string[] = formData.tempo.map((v) => v ?? '');
      const hasTempo = tempoFormatted.some((v) => v !== '');

      const templateData: Partial<ExerciseTemplate> = {
        exercise_id: exerciseId,
        sets: formData.sets ?? undefined,
        rep: formData.rep ?? undefined,
        time: formData.time ?? undefined,
        distance: distanceValue ?? undefined,
        weight: weightValue ?? undefined,
        rest_time: formData.rest_time ?? undefined,
        tempo: hasTempo ? tempoFormatted : undefined,
        rep_override: hasRepOverrides ? repOverrides : undefined,
        time_override: hasTimeOverrides ? timeOverrides : undefined,
        distance_override: hasDistanceOverrides
          ? distanceOverridesFormatted
          : undefined,
        weight_override: hasWeightOverrides
          ? weightOverridesFormatted
          : undefined,
        rest_time_override: hasRestTimeOverrides
          ? restTimeOverrides
          : undefined,
      };

      await onSave(templateData);
      onClose();
    }, 150);
  };

  const handleCopy = (onCopy: (data: Partial<ExerciseTemplate>) => void) => {
    const distanceValue = formatValueWithUnit(
      formData.distance,
      formData.distanceUnit,
    );
    const weightValue = formatValueWithUnit(
      formData.weight,
      formData.weightUnit,
    );
    const distanceOverrides = formData.distance_override
      .map((val, idx) =>
        formatValueWithUnit(val, formData.distance_override_units[idx] || 'm'),
      )
      .filter((v): v is string => v !== null);
    const weightOverrides = formData.weight_override
      .map((val, idx) =>
        formatValueWithUnit(val, formData.weight_override_units[idx] || 'kg'),
      )
      .filter((v): v is string => v !== null);

    const tempoFormatted: string[] = formData.tempo.map((v) => v ?? '');
    const hasTempo = tempoFormatted.some((v) => v !== '');

    onCopy({
      sets: formData.sets,
      rep: formData.rep ?? undefined,
      time: formData.time ?? undefined,
      distance: distanceValue ?? undefined,
      weight: weightValue ?? undefined,
      rest_time: formData.rest_time ?? undefined,
      tempo: hasTempo ? tempoFormatted : undefined,
      rep_override: formData.rep_override.filter(
        (v): v is number => v !== null,
      ),
      time_override: formData.time_override.filter(
        (v): v is number => v !== null,
      ),
      distance_override:
        distanceOverrides.length > 0 ? distanceOverrides : undefined,
      weight_override: weightOverrides.length > 0 ? weightOverrides : undefined,
      rest_time_override: formData.rest_time_override.filter(
        (v): v is number => v !== null,
      ),
    });
  };

  const handlePaste = () => {
    if (!copiedData) return;

    setFormData((prev) => {
      const updated = { ...prev };

      if (copiedData.sets !== undefined && copiedData.sets !== null) {
        updated.sets = copiedData.sets;
      }
      if (copiedData.rep !== undefined) updated.rep = copiedData.rep;
      if (copiedData.time !== undefined) updated.time = copiedData.time;
      if (copiedData.rest_time !== undefined)
        updated.rest_time = copiedData.rest_time;

      if (copiedData.distance) {
        const parsed = parseValueWithUnit(copiedData.distance);
        updated.distance = parsed.value;
        updated.distanceUnit = parsed.unit || 'm';
      }

      if (copiedData.weight) {
        const parsed = parseValueWithUnit(copiedData.weight);
        updated.weight = parsed.value;
        updated.weightUnit = parsed.unit || 'kg';
      }

      if (copiedData.rep_override && copiedData.rep_override.length > 0) {
        updated.rep_override = [
          ...copiedData.rep_override.map((v) => v ?? null),
        ];
        if (updated.rep_override.length < updated.sets) {
          updated.rep_override = [
            ...updated.rep_override,
            ...Array(updated.sets - updated.rep_override.length).fill(null),
          ];
        } else if (updated.rep_override.length > updated.sets) {
          updated.rep_override = updated.rep_override.slice(0, updated.sets);
        }
      }

      if (copiedData.time_override && copiedData.time_override.length > 0) {
        updated.time_override = [
          ...copiedData.time_override.map((v) => v ?? null),
        ];
        if (updated.time_override.length < updated.sets) {
          updated.time_override = [
            ...updated.time_override,
            ...Array(updated.sets - updated.time_override.length).fill(null),
          ];
        } else if (updated.time_override.length > updated.sets) {
          updated.time_override = updated.time_override.slice(0, updated.sets);
        }
      }

      if (
        copiedData.rest_time_override &&
        copiedData.rest_time_override.length > 0
      ) {
        updated.rest_time_override = [
          ...copiedData.rest_time_override.map((v) => v ?? null),
        ];
        if (updated.rest_time_override.length < updated.sets) {
          updated.rest_time_override = [
            ...updated.rest_time_override,
            ...Array(updated.sets - updated.rest_time_override.length).fill(
              null,
            ),
          ];
        } else if (updated.rest_time_override.length > updated.sets) {
          updated.rest_time_override = updated.rest_time_override.slice(
            0,
            updated.sets,
          );
        }
      }

      if (
        copiedData.distance_override &&
        copiedData.distance_override.length > 0
      ) {
        const parsed = copiedData.distance_override.map((d) =>
          parseValueWithUnit(d ?? null),
        );
        updated.distance_override = parsed.map((p) => p.value || null);
        updated.distance_override_units = parsed.map((p) => p.unit || 'm');
        if (updated.distance_override.length < updated.sets) {
          updated.distance_override = [
            ...updated.distance_override,
            ...Array(updated.sets - updated.distance_override.length).fill(
              null,
            ),
          ];
          updated.distance_override_units = [
            ...updated.distance_override_units,
            ...Array(
              updated.sets - updated.distance_override_units.length,
            ).fill('m'),
          ];
        } else if (updated.distance_override.length > updated.sets) {
          updated.distance_override = updated.distance_override.slice(
            0,
            updated.sets,
          );
          updated.distance_override_units =
            updated.distance_override_units.slice(0, updated.sets);
        }
      }

      if (copiedData.weight_override && copiedData.weight_override.length > 0) {
        const parsed = copiedData.weight_override.map((w) =>
          parseValueWithUnit(w ?? null),
        );
        updated.weight_override = parsed.map((p) => p.value || null);
        updated.weight_override_units = parsed.map((p) => p.unit || 'kg');
        if (updated.weight_override.length < updated.sets) {
          updated.weight_override = [
            ...updated.weight_override,
            ...Array(updated.sets - updated.weight_override.length).fill(null),
          ];
          updated.weight_override_units = [
            ...updated.weight_override_units,
            ...Array(updated.sets - updated.weight_override_units.length).fill(
              'kg',
            ),
          ];
        } else if (updated.weight_override.length > updated.sets) {
          updated.weight_override = updated.weight_override.slice(
            0,
            updated.sets,
          );
          updated.weight_override_units = updated.weight_override_units.slice(
            0,
            updated.sets,
          );
        }
      }

      if (copiedData.tempo && copiedData.tempo.length === 4) {
        updated.tempo = copiedData.tempo.map((v) => v ?? null);
      }

      return updated;
    });
  };

  const handleSave = async () => {
    if (!isValidTemplateItem(item)) return;

    const exerciseId = getExerciseId(item);

    const distanceValue = formatValueWithUnit(
      formData.distance,
      formData.distanceUnit,
    );
    const weightValue = formatValueWithUnit(
      formData.weight,
      formData.weightUnit,
    );

    const distanceOverrides = formData.distance_override.map((val, idx) =>
      formatValueWithUnit(val, formData.distance_override_units[idx] || 'm'),
    );

    const weightOverrides = formData.weight_override.map((val, idx) =>
      formatValueWithUnit(val, formData.weight_override_units[idx] || 'kg'),
    );

    const repOverrides: number[] = formData.rep_override.map((v) =>
      v !== null && v !== undefined ? v : -1,
    );
    const timeOverrides: number[] = formData.time_override.map((v) =>
      v !== null && v !== undefined ? v : -1,
    );
    const distanceOverridesFormatted: string[] = distanceOverrides.map(
      (v) => v ?? '-1',
    );
    const weightOverridesFormatted: string[] = weightOverrides.map(
      (v) => v ?? '-1',
    );
    const restTimeOverrides: number[] = formData.rest_time_override.map((v) =>
      v !== null && v !== undefined ? v : -1,
    );

    const hasRepOverrides = repOverrides.some((v) => v !== -1);
    const hasTimeOverrides = timeOverrides.some((v) => v !== -1);
    const hasDistanceOverrides = distanceOverridesFormatted.some(
      (v) => v !== '-1',
    );
    const hasWeightOverrides = weightOverridesFormatted.some((v) => v !== '-1');
      const hasRestTimeOverrides = restTimeOverrides.some((v) => v !== -1);

      // Format tempo: convert to string[] of length 4
      const tempoFormatted: string[] = formData.tempo.map((v) => v ?? '');
      const hasTempo = tempoFormatted.some((v) => v !== '');

    const templateData: Partial<ExerciseTemplate> = {
      exercise_id: exerciseId,
      sets: formData.sets ?? undefined,
      rep: formData.rep ?? undefined,
      time: formData.time ?? undefined,
      distance: distanceValue ?? undefined,
      weight: weightValue ?? undefined,
      rest_time: formData.rest_time ?? undefined,
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
    };

    await onSave(templateData);
    onClose();
  };

  return {
    formData,
    setFormData,
    activeTab,
    setActiveTab,
    currentSetIndex,
    setCurrentSetIndex,
    handleSetsChange,
    setCurrentValue,
    handleBlur,
    handleCopy,
    handlePaste,
    handleSave,
  };
}
