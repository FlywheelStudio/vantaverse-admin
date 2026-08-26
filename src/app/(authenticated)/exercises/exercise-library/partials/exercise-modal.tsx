'use client';

import { useEffect, useRef, useState } from 'react';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import { Icon } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { useUpdateExercise } from '@/hooks/use-exercise-mutations';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ExerciseTagsSection } from './exercise-tags-section';

interface ExerciseModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAME_MAX = 80;
const TIP_MAX = 400;
const CHECK_IN_MAX = 140;

/** A check-in question asks the member to confirm their own form or effort. */
const CHECK_IN_PLACEHOLDER =
  'Did you keep your hips in line with your knees through the whole squat?';

const CHECK_IN_EXAMPLES: ReadonlyArray<{ label: string; value: string }> = [
  {
    label: 'Alignment',
    value: 'Did you keep your hips in line with your knees the whole way down?',
  },
  {
    label: 'Full range',
    value: 'Were you able to move through the full range without cutting it short?',
  },
  {
    label: 'Control',
    value: 'Could you control the movement on the way back up?',
  },
];

interface Draft {
  exercise_name: string;
  library_tip: string;
  library_check_in_question: string;
}

function toDraft(exercise: Exercise): Draft {
  return {
    exercise_name: exercise.exercise_name ?? '',
    library_tip: exercise.library_tip ?? '',
    library_check_in_question: exercise.library_check_in_question ?? '',
  };
}

function formatTypeLabel(type: string): string {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRelativeTimeDisplay(dateString: string | null): string {
  if (!dateString) return 'never';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return 'recently';
  }
}

export function ExerciseModal({
  exercise,
  open,
  onOpenChange,
}: ExerciseModalProps): React.ReactElement | null {
  if (!exercise) return null;

  return (
    <ExerciseModalContent
      key={exercise.id}
      exercise={exercise}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

interface CopyFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  max: number;
  rows: number;
  placeholder: string;
  emptyNote?: string;
  dirty: boolean;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}

/** Label + live counter, optional caption, auto-growing control, status line. */
function CopyField({
  id,
  label,
  hint,
  value,
  max,
  rows,
  placeholder,
  emptyNote,
  dirty,
  onChange,
  children,
}: CopyFieldProps): React.ReactElement {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const note = dirty ? 'Unsaved' : !value.trim() ? emptyNote : undefined;

  return (
    <div className="fgrp">
      <div className="fgrp-hd">
        <label className="lbl" htmlFor={id}>
          {label}
        </label>
        <span className={cn('fgrp-meta', value.length > max && 'over')}>
          {value.length}/{max}
        </span>
      </div>
      {hint ? <p className="fgrp-hint">{hint}</p> : null}
      <textarea
        id={id}
        ref={ref}
        className="ta ta-grow"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ minHeight: rows * 21 + 22 }}
      />
      {children}
      <div className={cn('fgrp-note', dirty && 'dt')}>{note}</div>
    </div>
  );
}

interface ExerciseModalContentProps {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ExerciseModalContent({
  exercise,
  open,
  onOpenChange,
}: ExerciseModalContentProps): React.ReactElement {
  const [draft, setDraft] = useState<Draft>(() => toDraft(exercise));
  const [showVideo, setShowVideo] = useState(false);
  const updateExerciseMutation = useUpdateExercise();
  const source = exercise.type ? formatTypeLabel(exercise.type) : 'MedVanta';
  const lastEditedTime = getRelativeTimeDisplay(
    exercise.updated_at || exercise.created_at,
  );

  const usedInPrograms = exercise.assigned_count ?? 0;
  const isUnassigned = usedInPrograms === 0;
  const exerciseIdLabel = `ID EX-${exercise.id}`;

  const saved = toDraft(exercise);
  const isDirty = (field: keyof Draft): boolean =>
    draft[field].trim() !== saved[field].trim();
  const dirtyCount = (Object.keys(draft) as (keyof Draft)[]).filter(isDirty)
    .length;
  const nameIsEmpty = draft.exercise_name.trim().length === 0;

  const setField = (field: keyof Draft, value: string): void => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveExercise = (): void => {
    if (updateExerciseMutation.isPending) return;

    if (dirtyCount === 0 || nameIsEmpty) {
      onOpenChange(false);
      return;
    }

    const updateData: Partial<Exercise> = {};
    if (isDirty('exercise_name')) {
      updateData.exercise_name = draft.exercise_name.trim();
    }
    if (isDirty('library_tip')) {
      updateData.library_tip = draft.library_tip.trim() || null;
    }
    if (isDirty('library_check_in_question')) {
      updateData.library_check_in_question =
        draft.library_check_in_question.trim() || null;
    }

    updateExerciseMutation.mutate({ id: exercise.id, data: updateData });
    onOpenChange(false);
  };

  const handleCancel = (): void => {
    setDraft(toDraft(exercise));
    onOpenChange(false);
  };

  const getVideoUrl = (): string | null => {
    if (exercise.video_type === 'youtube' && exercise.video_url) {
      return `https://www.youtube.com/embed/${exercise.video_url}`;
    }
    if (exercise.video_type === 'file' && exercise.video_url) {
      return exercise.video_url;
    }
    return null;
  };

  const videoUrl = getVideoUrl();
  const thumb =
    exercise.thumbnail_url && typeof exercise.thumbnail_url === 'object'
      ? exercise.thumbnail_url
      : null;

  const nameNote = nameIsEmpty
    ? 'Exercise name is required.'
    : isDirty('exercise_name')
      ? 'Unsaved'
      : undefined;

  return (
    <HtmlModal
      open={open}
      title="Edit exercise"
      subtitle="Changes apply everywhere this exercise is used."
      onClose={handleCancel}
      width={760}
      style={{ maxHeight: 'min(90vh, 720px)' }}
      bodyClassName="overflow-y-auto"
      footerInfo={
        dirtyCount > 0
          ? `${dirtyCount} unsaved change${dirtyCount === 1 ? '' : 's'}`
          : `Last edited ${lastEditedTime}`
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-acc"
            onClick={handleSaveExercise}
            disabled={
              updateExerciseMutation.isPending || dirtyCount === 0 || nameIsEmpty
            }
          >
            Save exercise
          </button>
        </>
      }
    >
      <div
        className="g"
        style={{
          gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr)',
          gap: 20,
          marginBottom: 4,
        }}
      >
        <div>
          {videoUrl ? (
            <div
              className="thmb gr"
              style={{
                aspectRatio: '4/3',
                width: '100%',
                position: 'relative',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {!showVideo ? (
                <>
                  <ExerciseThumbnail
                    blurhash={thumb?.blurhash ?? null}
                    imageUrl={thumb?.image_url ?? null}
                    videoUrl={null}
                    videoType={exercise.video_type}
                    alt={exercise.exercise_name}
                    className="h-full w-full"
                    fill
                    aspectVideo={false}
                    showVideoFallback={false}
                  />
                  <span className="src-b">{source}</span>
                  <button
                    type="button"
                    onClick={() => setShowVideo(true)}
                    className="pl"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: 1,
                    }}
                    aria-label="Play video"
                  >
                    <i>
                      <Icon
                        name="Play"
                        size={20}
                        style={{ fill: 'currentColor' }}
                      />
                    </i>
                  </button>
                </>
              ) : exercise.video_type === 'youtube' ? (
                <iframe
                  src={videoUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={exercise.exercise_name}
                />
              ) : (
                <video
                  src={videoUrl}
                  controls
                  className="h-full w-full"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ) : (
            <div
              className="thmb gr"
              style={{
                aspectRatio: '4/3',
                width: '100%',
                position: 'relative',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <ExerciseThumbnail
                blurhash={thumb?.blurhash ?? null}
                imageUrl={thumb?.image_url ?? null}
                videoUrl={null}
                videoType={exercise.video_type}
                alt={exercise.exercise_name}
                className="h-full w-full"
                fill
                aspectVideo={false}
                showVideoFallback={true}
              />
              <span className="src-b">{source}</span>
            </div>
          )}
        </div>

        <div>
          <div className="fgrp">
            <div className="fgrp-hd">
              <label className="lbl" htmlFor="exercise-name">
                Exercise name<span className="req">*</span>
              </label>
              <span
                className={cn(
                  'fgrp-meta',
                  draft.exercise_name.length > NAME_MAX && 'over',
                )}
              >
                {draft.exercise_name.length}/{NAME_MAX}
              </span>
            </div>
            <span className={cn('fld', nameIsEmpty && 'inv')}>
              <input
                id="exercise-name"
                value={draft.exercise_name}
                onChange={(e) => setField('exercise_name', e.target.value)}
                placeholder="e.g. Standing Hip Abduction"
              />
            </span>
            <div
              className={cn(
                'fgrp-note',
                nameIsEmpty ? 'err' : isDirty('exercise_name') && 'dt',
              )}
            >
              {nameNote}
            </div>
          </div>

          <div className="fgrp">
            <div className="fgrp-hd">
              <label className="lbl" htmlFor="exercise-source">
                Source
              </label>
            </div>
            <span className="fld ro">
              <input
                id="exercise-source"
                value={source}
                readOnly
                disabled
                aria-label="Source"
              />
            </span>
          </div>

          <div
            className="row"
            style={{
              gap: 8,
              marginTop: 4,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            {isUnassigned ? <span className="bdg bdg-o">Unassigned</span> : null}
            <span className="bdg">
              Used in {usedInPrograms} program
              {usedInPrograms === 1 ? '' : 's'}
            </span>
            <span className="bdg mono">{exerciseIdLabel}</span>
          </div>
        </div>
      </div>

      <div className="fsec">
        <div className="fsec-t">What the member sees</div>

        <CopyField
          id="exercise-instructions"
          label="Instructions for members"
          hint="Shown under the video in the member app. Plain language, no clinical shorthand."
          value={draft.library_tip}
          max={TIP_MAX}
          rows={3}
          placeholder="Describe the set-up, the movement, and what good execution feels like…"
          emptyNote="Empty — members see the video with no written guidance."
          dirty={isDirty('library_tip')}
          onChange={(value) => setField('library_tip', value)}
        />

        <CopyField
          id="exercise-check-in"
          label="Check-in question"
          value={draft.library_check_in_question}
          max={CHECK_IN_MAX}
          rows={2}
          placeholder={CHECK_IN_PLACEHOLDER}
          emptyNote="Empty — nothing is asked after a set."
          dirty={isDirty('library_check_in_question')}
          onChange={(value) => setField('library_check_in_question', value)}
        >
          <div className="ex-chips">
            <span className="cl">Start from:</span>
            {CHECK_IN_EXAMPLES.map((example) => (
              <button
                key={example.label}
                type="button"
                className="chip-s"
                onClick={() =>
                  setField('library_check_in_question', example.value)
                }
              >
                {example.label}
              </button>
            ))}
          </div>
        </CopyField>
      </div>

      <ExerciseTagsSection exerciseId={exercise.id} />
    </HtmlModal>
  );
}
