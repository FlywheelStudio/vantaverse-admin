'use client';

import { Icon } from '@/components/medvanta';
import { getDayOfWeek } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';
import type { DefaultValuesData } from '@/app/(authenticated)/builder/[id]/default-values/schemas';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import { ExerciseDetailsPopover } from './partials/exercise-details-popover';
import { useRef } from 'react';

const MAX_VISIBLE_ITEMS = 6;

interface DayBoxProps {
  day: number;
  weekIndex: number;
  items: SelectedItem[];
  formattedDate: string | null;
  isOutOfBounds: boolean;
  isDayCopied: boolean;
  isDayPasteDisabled: boolean;
  isPasteAnimating?: boolean;
  index: number;
  onAddExercise: (day: number) => void;
  onCopyDay: () => void;
  onPasteDay: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  defaultValues?: DefaultValuesData;
  onReorder?: (items: SelectedItem[]) => void;
}

function formatExerciseParams(template: ExerciseTemplate): string {
  const parts: string[] = [];
  if (template.sets != null) parts.push(`${template.sets}×`);
  if (template.rep != null) parts.push(`${template.rep}`);
  else if (template.time != null) parts.push(`${template.time}s`);
  else if (template.distance != null) parts.push(`${template.distance}`);
  if (template.weight != null && template.weight !== '') {
    parts.push(`@ ${template.weight}`);
  }
  return parts.join(' ').trim();
}

/**
 * HTML `.day` card — equal-height week column with copy/paste in `.df` footer.
 */
export function DayBox({
  day,
  weekIndex,
  items,
  formattedDate,
  isOutOfBounds,
  isDayCopied,
  isDayPasteDisabled,
  isPasteAnimating = false,
  onAddExercise,
  onCopyDay,
  onPasteDay,
  onMouseEnter,
  onMouseLeave,
  defaultValues,
  onReorder,
}: DayBoxProps): React.ReactElement {
  // Reordering only supports flat exercise lists; groups are edited in the modal.
  const canReorder =
    !isOutOfBounds && items.length > 1 && items.every((i) => i.type !== 'group');
  const dragIndexRef = useRef<number | null>(null);

  const handleDrop = (targetIndex: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === targetIndex) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    onReorder?.(next);
  };

  const hasItems = items.length > 0;
  const isRest = !hasItems;
  const dayLabel = getDayOfWeek(day)?.slice(0, 3).toUpperCase() ?? `D${day}`;

  const getTemplateFromExercise = (
    item: Extract<SelectedItem, { type: 'exercise' }>,
  ): ExerciseTemplate => {
    const base: Partial<ExerciseTemplate> = defaultValues
      ? {
          sets: defaultValues.sets,
          rep: defaultValues.rep,
          time: defaultValues.time,
          distance: defaultValues.distance,
          weight: defaultValues.weight,
          rest_time: defaultValues.rest_time,
          tempo: defaultValues.tempo as string[],
        }
      : {};

    return {
      ...base,
      id: `synthetic-${item.data.id}`,
      template_hash: 'synthetic',
      exercise_id: item.data.id,
      notes: null,
      rep_override: null,
      time_override: null,
      distance_override: null,
      weight_override: null,
      rest_time_override: null,
      created_at: null,
      updated_at: null,
      exercise_name: item.data.exercise_name,
      video_type: item.data.video_type,
      video_url: item.data.video_url,
      thumbnail_url: item.data.thumbnail_url ?? undefined,
      sets: base.sets ?? null,
      time: base.time ?? null,
      rep: base.rep ?? null,
      distance: base.distance ?? null,
      weight: base.weight ?? null,
      rest_time: base.rest_time ?? null,
      tempo: base.tempo ?? null,
    };
  };

  const flattenLeaves = (list: SelectedItem[]): SelectedItem[] => {
    const out: SelectedItem[] = [];
    for (const item of list) {
      if (item.type === 'group') {
        out.push(...flattenLeaves(item.data.items));
      } else {
        out.push(item);
      }
    }
    return out;
  };

  const leafItems = flattenLeaves(items);
  const visibleItems = leafItems.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = Math.max(0, leafItems.length - MAX_VISIBLE_ITEMS);

  const renderExerciseRow = (
    item: SelectedItem,
    itemIndex: number,
  ): React.ReactElement | null => {
    if (item.type === 'group') return null;

    const template =
      item.type === 'template'
        ? item.data
        : getTemplateFromExercise(
            item as Extract<SelectedItem, { type: 'exercise' }>,
          );
    const displayName = template.exercise_name || 'Unnamed Exercise';
    const params = formatExerciseParams(template);
    const thumb = template.thumbnail_url;

    return (
      <ExerciseDetailsPopover
        key={`item-${itemIndex}`}
        template={template}
        className="w-full"
      >
        <div
          className="ex-r"
          role="button"
          tabIndex={0}
          draggable={canReorder}
          style={{ cursor: canReorder ? 'grab' : undefined }}
          onDragStart={() => {
            dragIndexRef.current = itemIndex;
          }}
          onDragOver={(e) => {
            if (dragIndexRef.current !== null) e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleDrop(itemIndex);
          }}
          onDragEnd={() => {
            dragIndexRef.current = null;
          }}
        >
          <span
            className="et thmb"
            style={
              thumb
                ? {
                    backgroundImage: `url(${thumb})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
            aria-hidden
          >
            {!thumb ? <Icon name="Dumbbell" size={12} /> : null}
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span className="en">{displayName}</span>
            {params ? <span className="ep">{params}</span> : null}
          </span>
          <Icon name="GripVertical" size={12} className="gh" />
        </div>
      </ExerciseDetailsPopover>
    );
  };

  return (
    <div
      className={cn(
        'day',
        isOutOfBounds && 'disabled',
        !isOutOfBounds && isRest && 'rest',
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-week={weekIndex}
      data-day={day}
    >
      <div className="dh">
        <span
          className="dn"
          style={isOutOfBounds ? { color: 'var(--text-muted)' } : undefined}
        >
          {dayLabel}
        </span>
        {formattedDate ? (
          <span
            className="dd"
            style={isOutOfBounds ? { color: 'var(--text-muted)' } : undefined}
          >
            {formattedDate}
          </span>
        ) : null}
        <span className="sp" />
        {!isOutOfBounds && (
          <>
            <button
              type="button"
              className="ib ib-sm"
              aria-label={isDayCopied ? 'Day copied' : 'Copy day'}
              title={isDayCopied ? 'Copied — Ctrl/⌘+C' : 'Copy day — Ctrl/⌘+C'}
              onClick={(e) => {
                e.stopPropagation();
                onCopyDay();
              }}
              style={
                isDayCopied
                  ? { color: 'var(--success, var(--cyan-600))' }
                  : undefined
              }
            >
              <Icon name={isDayCopied ? 'Check' : 'Copy'} size={14} />
            </button>
            <button
              type="button"
              className="ib ib-sm"
              aria-label="Paste day"
              title={
                isDayPasteDisabled
                  ? isDayCopied
                    ? 'Already the copied day'
                    : 'Nothing to paste'
                  : 'Paste day — Ctrl/⌘+V'
              }
              disabled={isDayPasteDisabled}
              onClick={(e) => {
                e.stopPropagation();
                onPasteDay();
              }}
              style={{
                opacity: isDayPasteDisabled ? 0.4 : 1,
                color: isPasteAnimating
                  ? 'var(--success, var(--cyan-600))'
                  : undefined,
              }}
            >
              <Icon name="ClipboardPaste" size={14} />
            </button>
          </>
        )}
      </div>

      {isOutOfBounds ? (
        <div className="na-m">
          <span className="nl">N/A</span>
        </div>
      ) : hasItems ? (
        <div className="dbody">
          {visibleItems.map((item, idx) => renderExerciseRow(item, idx))}
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="dmore"
              onClick={() => onAddExercise(day)}
            >
              +{hiddenCount} more
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rest-m">
          <Icon name="Moon" size={18} />
          <span className="rl">Rest day</span>
        </div>
      )}

      {!isOutOfBounds && (
        <div className="df">
          <button
            type="button"
            className={cn('btn btn-sm', hasItems ? 'btn-sec' : 'btn-ghost')}
            onClick={() => onAddExercise(day)}
          >
            <Icon name="Plus" size={14} />
            {hasItems ? 'Edit' : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
}
