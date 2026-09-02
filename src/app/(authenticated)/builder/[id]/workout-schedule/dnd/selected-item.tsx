'use client';

import { generateExerciseTemplateDescription, generateDefaultValuesDescription } from '@/lib/utils/exercise-template-description';
import { PlayButton } from '@/components/ui/play-button';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';
import { cn } from '@/lib/utils';
import { useDefaultValues } from '@/app/(authenticated)/builder/[id]/default-values/use-default-values';
import {
  DEFAULT_DAY_PRESCRIPTION,
  type DayPrescription,
} from '../exercise-builder-mock-data';

interface SelectedItemProps {
  item: SelectedItem;
  onRemove: () => void;
  onClick: (event: React.MouseEvent) => void;
  onPrescriptionChange?: (prescription: DayPrescription) => void;
}

export function SelectedItemComponent({
  item,
  onRemove,
  onClick,
  onPrescriptionChange,
}: SelectedItemProps): React.ReactElement | null {
  const { values: defaultValues } = useDefaultValues();
  const rx =
    item.type !== 'group'
      ? (item.prescription ?? DEFAULT_DAY_PRESCRIPTION)
      : DEFAULT_DAY_PRESCRIPTION;

  if (item.type === 'group') {
    return null;
  }

  const exerciseName =
    item.type === 'exercise'
      ? item.data.exercise_name
      : item.data.exercise_name || 'Unnamed Exercise';

  const hasVideo =
    (item.type === 'exercise' || item.type === 'template') &&
    item.data.video_url &&
    item.data.video_type;

  const getDescription = (): string => {
    if (item.type === 'template') {
      return generateExerciseTemplateDescription(item.data);
    }
    return generateDefaultValuesDescription(defaultValues);
  };

  const handleRxChange = (
    field: keyof DayPrescription,
    value: string,
  ): void => {
    const next = { ...rx, [field]: value };
    onPrescriptionChange?.(next);
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
          {hasVideo && (item.type === 'exercise' || item.type === 'template') && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <PlayButton
                videoUrl={item.data.video_url || null}
                videoType={item.data.video_type}
                exerciseName={exerciseName}
                thumbnailUrl={
                  item.data.thumbnail_url && typeof item.data.thumbnail_url === 'object'
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
      >
        {(
          [
            ['sets', rx.sets, 'sets'],
            ['reps', rx.reps, 'reps'],
            ['rest', rx.rest, 'rest'],
          ] as const
        ).map(([field, value, label]) => (
          <span
            key={field}
            className="fld fld-sm"
            style={{ flex: 1, padding: '0 8px', gap: 4 }}
          >
            <input
              value={value}
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
