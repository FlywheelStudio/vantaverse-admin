'use client';

import { useState } from 'react';
import { flushSync } from 'react-dom';
import {
  generateExerciseTemplateDescription,
  generateDefaultValuesDescription,
} from '@/lib/utils/exercise-template-description';
import { PlayButton } from '@/components/ui/play-button';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';
import { cn } from '@/lib/utils';
import { useDefaultValues } from '@/app/(authenticated)/builder/[id]/default-values/use-default-values';
import type { DefaultValuesData } from '@/app/(authenticated)/builder/[id]/default-values/schemas';
import type { DayPrescription } from '../exercise-builder-mock-data';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface SelectedItemProps {
  item: SelectedItem;
  onRemove: () => void;
  onClick: (event: React.MouseEvent) => void;
  onItemChange?: (item: SelectedItem) => void;
}

type RxField = keyof DayPrescription;

const RX_FIELDS: Array<[RxField, string]> = [
  ['sets', 'sets'],
  ['reps', 'reps'],
  ['time', 'time'],
  ['rest', 'rest'],
];

const EMPTY_PRESCRIPTION: DayPrescription = {
  sets: '',
  reps: '',
  time: '',
  rest: '',
};

const toDisplay = (value: number | null | undefined): string =>
  value !== null && value !== undefined ? String(value) : '';

/**
 * Seeds quick-assign bubbles from the same source as the card subtitle.
 */
function prescriptionFromItem(
  item: Exclude<SelectedItem, { type: 'group' }>,
  defaults: DefaultValuesData,
): DayPrescription {
  if (item.type === 'template') {
    return {
      sets: toDisplay(item.data.sets),
      reps: toDisplay(item.data.rep),
      time: toDisplay(item.data.time),
      rest: toDisplay(item.data.rest_time),
    };
  }

  return {
    sets: toDisplay(defaults.sets),
    reps: toDisplay(defaults.rep),
    time: toDisplay(defaults.time),
    rest: toDisplay(defaults.rest_time),
  };
}

const parseNonNegInt = (value: string): number | null => {
  const trimmed = value.trim().replace(/s$/i, '');
  if (trimmed === '') return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
};

const prescriptionsEqual = (a: DayPrescription, b: DayPrescription): boolean =>
  a.sets === b.sets &&
  a.reps === b.reps &&
  a.time === b.time &&
  a.rest === b.rest;

/**
 * Builds a provisional template from a library exercise + All-values fields.
 * Empty id/hash: Save day upserts via syncSelectedItemTemplates.
 */
function buildTemplateFromExercise(
  exercise: Exercise,
  fields: {
    sets: number;
    rep: number | null;
    time: number | null;
    rest_time: number | null;
  },
): ExerciseTemplate {
  return {
    id: '',
    template_hash: '',
    exercise_id: exercise.id,
    exercise_name: exercise.exercise_name,
    video_type: exercise.video_type,
    video_url: exercise.video_url ?? null,
    thumbnail_url: exercise.thumbnail_url,
    notes: null,
    sets: fields.sets,
    rep: fields.rep,
    time: fields.time,
    distance: null,
    weight: null,
    rest_time: fields.rest_time,
    tempo: null,
    rep_override: null,
    time_override: null,
    distance_override: null,
    weight_override: null,
    rest_time_override: null,
    created_at: null,
    updated_at: null,
  };
}

/**
 * Commits bubble draft into the selected item as All-values (clears per-set overrides).
 * No DB write — Save day persists via syncSelectedItemTemplates.
 */
export function SelectedItemComponent({
  item,
  onRemove,
  onClick,
  onItemChange,
}: SelectedItemProps): React.ReactElement | null {
  const { values: defaultValues } = useDefaultValues();

  const isExerciseRow = item.type === 'exercise' || item.type === 'template';
  const baseline = isExerciseRow
    ? prescriptionFromItem(item, defaultValues)
    : EMPTY_PRESCRIPTION;

  const [draft, setDraft] = useState<DayPrescription>(baseline);
  const [syncedBaseline, setSyncedBaseline] =
    useState<DayPrescription>(baseline);

  // Reset draft when item/defaults change (React "adjusting state when a prop changes")
  if (!prescriptionsEqual(baseline, syncedBaseline)) {
    setSyncedBaseline(baseline);
    setDraft(baseline);
  }

  if (!isExerciseRow) {
    return null;
  }

  const exerciseName =
    item.type === 'exercise'
      ? item.data.exercise_name
      : item.data.exercise_name || 'Unnamed Exercise';

  const hasVideo = Boolean(item.data.video_url && item.data.video_type);

  const getDescription = (): string => {
    if (item.type === 'template') {
      return generateExerciseTemplateDescription(item.data);
    }
    return generateDefaultValuesDescription(defaultValues);
  };

  const handleRxChange = (field: RxField, value: string): void => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (): void => {
    if (prescriptionsEqual(draft, baseline)) return;

    const sets = parseNonNegInt(draft.sets);
    const rep = parseNonNegInt(draft.reps);
    const time = parseNonNegInt(draft.time);
    const rest_time = parseNonNegInt(draft.rest);

    if (sets === null || sets < 1) {
      setDraft(baseline);
      return;
    }

    const fields = { sets, rep, time, rest_time };

    // flushSync so Save day (same click after blur) sees updated selectedItems
    flushSync(() => {
      if (item.type === 'template') {
        onItemChange?.({
          type: 'template',
          data: {
            ...item.data,
            ...fields,
            rep_override: null,
            time_override: null,
            distance_override: null,
            weight_override: null,
            rest_time_override: null,
          },
        });
      } else {
        onItemChange?.({
          type: 'template',
          data: buildTemplateFromExercise(item.data, fields),
        });
      }
    });
  };

  return (
    <div
      className={cn(
        'border border-[var(--border-subtle)] bg-[var(--surface-card)] rounded-[var(--radius-md)] p-[10px_11px] flex flex-col gap-2',
        'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 min-w-0">
          {hasVideo && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <PlayButton
                videoUrl={item.data.video_url || null}
                videoType={item.data.video_type}
                exerciseName={exerciseName}
                thumbnailUrl={
                  item.data.thumbnail_url &&
                  typeof item.data.thumbnail_url === 'object'
                    ? item.data.thumbnail_url
                    : undefined
                }
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-[var(--fw-semibold)] text-[length:var(--text-sm)] text-[var(--text-strong)] leading-[1.3]">
              {exerciseName}
            </div>
            <div className="text-[length:var(--text-xs)] text-[var(--text-muted)] mt-0.5">
              {getDescription()}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-[var(--danger)] hover:opacity-80 text-lg leading-none cursor-pointer"
          aria-label="Remove"
        >
          ×
        </button>
      </div>

      <div
        className="row"
        style={{ gap: 7 }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onBlur={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
          handleBlur();
        }}
      >
        {RX_FIELDS.map(([field, label]) => (
          <span
            key={field}
            className="fld fld-sm"
            style={{ flex: 1, padding: '0 8px', gap: 4 }}
          >
            <input
              value={draft[field]}
              className="mono"
              style={{
                textAlign: 'center',
                width: '100%',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 'var(--text-sm)',
              }}
              onChange={(e) => handleRxChange(field, e.target.value)}
              aria-label={label}
            />
            <span
              className="mut"
              style={{ fontSize: 10, whiteSpace: 'nowrap' }}
            >
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
