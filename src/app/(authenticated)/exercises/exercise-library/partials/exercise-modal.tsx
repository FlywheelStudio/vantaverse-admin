'use client';

import { useState, useRef, useEffect } from 'react';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import { Icon, Textarea } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { HtmlActionsMenu } from '@/components/medvanta/shell/HtmlActionsMenu';
import { useUpdateExercise } from '@/hooks/use-exercise-mutations';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import {
  EXERCISE_CATEGORY_OPTIONS,
  EXERCISE_SOURCE_OPTIONS,
  MEDIA_OVERFLOW_ACTIONS,
  createExerciseModalMocks,
  type ExerciseCategory,
  type ExerciseSource,
  type MockCheckInQuestion,
  type MockPrescription,
  type TagGroup,
} from './exercise-modal-mock-data';

interface ExerciseModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditableField = 'exercise_name' | 'library_tip';

function MedvantaSelect({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  'aria-label'?: string;
}): React.ReactElement {
  return (
    <span className="sel" style={{ width: '100%' }}>
      <select
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="ci">
        <Icon name="ChevronDown" size={16} />
      </span>
    </span>
  );
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

interface ExerciseModalContentProps {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ExerciseModalContent({
  exercise: exerciseProp,
  open,
  onOpenChange,
}: ExerciseModalContentProps): React.ReactElement {
  const updateExerciseMutation = useUpdateExercise();
  const initialMocks = createExerciseModalMocks({
    existingCheckIn: exerciseProp.library_check_in_question,
    typeHint: exerciseProp.type,
  });
  const [localExercise, setLocalExercise] = useState<Exercise>(exerciseProp);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showVideo, setShowVideo] = useState(false);
  const [category, setCategory] = useState<ExerciseCategory>(
    initialMocks.category,
  );
  const [source, setSource] = useState<ExerciseSource>(initialMocks.source);
  const [prescription, setPrescription] = useState<MockPrescription>(
    initialMocks.prescription,
  );
  const [tagGroups, setTagGroups] = useState<TagGroup[]>(
    initialMocks.tagGroups,
  );
  const [checkInQuestions, setCheckInQuestions] = useState<
    MockCheckInQuestion[]
  >(initialMocks.checkInQuestions);
  const lastEditedBy = initialMocks.lastEditedBy;
  const titleRef = useRef<HTMLDivElement>(null);
  const instructionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingField === 'exercise_name') {
      titleRef.current?.querySelector('input')?.focus();
    } else if (editingField === 'library_tip') {
      instructionsRef.current?.querySelector('textarea')?.focus();
    }
  }, [editingField]);

  const exercise = localExercise;
  const usedInPrograms = exercise.assigned_count ?? 0;
  const isUnassigned = usedInPrograms === 0;
  const exerciseIdLabel = `ID EX-${exercise.id}`;

  const handleEdit = (field: EditableField): void => {
    if (updateExerciseMutation.isPending) return;
    const value =
      field === 'exercise_name'
        ? exercise.exercise_name
        : exercise.library_tip || '';
    setEditingField(field);
    setEditingValue(value);
  };

  const handleSaveField = (field: EditableField): void => {
    if (updateExerciseMutation.isPending) return;

    const originalValue =
      field === 'exercise_name'
        ? exercise.exercise_name
        : exercise.library_tip;

    const normalizedNew = editingValue.trim();
    const normalizedOriginal = originalValue?.trim() || '';

    if (normalizedNew !== normalizedOriginal) {
      const updateData: Partial<Exercise> = {
        [field]: normalizedNew || null,
      };

      setLocalExercise((prev) =>
        prev ? { ...prev, [field]: normalizedNew || null } : prev,
      );

      updateExerciseMutation.mutate({
        id: exercise.id,
        data: updateData,
      });
    }

    setEditingField(null);
    setEditingValue('');
  };

  const handleSaveExercise = (): void => {
    if (editingField) {
      handleSaveField(editingField);
    }
    onOpenChange(false);
  };

  const handleCancel = (): void => {
    setEditingField(null);
    setEditingValue('');
    onOpenChange(false);
  };

  const handleRemoveTag = (groupId: string, tag: string): void => {
    setTagGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, tags: g.tags.filter((t) => t !== tag) }
          : g,
      ),
    );
  };

  const handleRemoveCheckIn = (id: string): void => {
    setCheckInQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleAddCheckIn = (): void => {
    setCheckInQuestions((prev) => [
      ...prev,
      {
        id: `ci-new-${prev.length + 1}`,
        typeBadge: 'Yes / No',
        text: 'New check-in question',
      },
    ]);
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

  const mediaMenuItems = MEDIA_OVERFLOW_ACTIONS.map((action) => ({
    id: action.id,
    label: action.label,
    danger: 'danger' in action ? action.danger : false,
    onSelect: () => undefined,
  }));

  const titleContent =
    editingField === 'exercise_name' ? (
      <div ref={titleRef}>
        <span className="fld">
          <input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={() => handleSaveField('exercise_name')}
            aria-label="Exercise name"
          />
        </span>
      </div>
    ) : (
      <button
        type="button"
        onClick={() => handleEdit('exercise_name')}
        className="fld"
        style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ flex: 1 }}>{exercise.exercise_name}</span>
      </button>
    );

  return (
    <HtmlModal
      open={open}
      title="Edit exercise"
      subtitle="Changes apply everywhere this exercise is used."
      onClose={handleCancel}
      width={760}
      style={{ maxHeight: 'min(90vh, 720px)' }}
      bodyClassName="overflow-y-auto"
      footerInfo={`Last edited 5 months ago by ${lastEditedBy}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-pri"
            onClick={handleSaveExercise}
            disabled={updateExerciseMutation.isPending}
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
          marginBottom: 20,
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

          <div className="row" style={{ gap: 8, marginTop: 10 }}>
            <button
              type="button"
              className="btn btn-sec btn-sm"
              style={{ flex: 1 }}
              onClick={() => undefined}
            >
              <Icon name="Upload" size={15} />
              Replace media
            </button>
            <HtmlActionsMenu items={mediaMenuItems} ariaLabel="Media actions" />
          </div>
        </div>

        <div>
          <div className="ff">
            <label className="lbl">
              Exercise name<span className="req">*</span>
            </label>
            {titleContent}
          </div>

          <div className="g g2" style={{ gap: 12, marginBottom: 16 }}>
            <div>
              <label className="lbl">Category</label>
              <MedvantaSelect
                value={category}
                aria-label="Category"
                options={EXERCISE_CATEGORY_OPTIONS}
                onChange={(v) => setCategory(v as ExerciseCategory)}
              />
            </div>
            <div>
              <label className="lbl">Source</label>
              <MedvantaSelect
                value={source}
                aria-label="Source"
                options={EXERCISE_SOURCE_OPTIONS}
                onChange={(v) => setSource(v as ExerciseSource)}
              />
            </div>
          </div>

          <div>
            <label className="lbl">Default prescription</label>
            <div className="row" style={{ gap: 8 }}>
              <span
                className="fld fld-sm"
                style={{ flex: 1, padding: '0 10px', gap: 4 }}
              >
                <input
                  value={prescription.sets}
                  className="mono"
                  style={{ textAlign: 'center', width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                  onChange={(e) =>
                    setPrescription((p) => ({ ...p, sets: e.target.value }))
                  }
                  aria-label="Sets"
                />
                <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
                  sets
                </span>
              </span>
              <span
                className="fld fld-sm"
                style={{ flex: 1, padding: '0 10px', gap: 4 }}
              >
                <input
                  value={prescription.reps}
                  className="mono"
                  style={{ textAlign: 'center', width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                  onChange={(e) =>
                    setPrescription((p) => ({ ...p, reps: e.target.value }))
                  }
                  aria-label="Reps"
                />
                <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
                  reps
                </span>
              </span>
              <span
                className="fld fld-sm"
                style={{ flex: 1, padding: '0 10px', gap: 4 }}
              >
                <input
                  value={prescription.rest}
                  className="mono"
                  style={{ textAlign: 'center', width: '100%', border: 'none', background: 'transparent', outline: 'none' }}
                  onChange={(e) =>
                    setPrescription((p) => ({ ...p, rest: e.target.value }))
                  }
                  aria-label="Rest"
                />
                <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
                  rest
                </span>
              </span>
            </div>
            <div className="hint">
              Pre-fills the value whenever this exercise is added to a workout.
            </div>
          </div>

          <div
            className="row"
            style={{
              gap: 8,
              marginTop: 16,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
            }}
          >
            {isUnassigned ? (
              <span className="bdg bdg-o">Unassigned</span>
            ) : null}
            <span className="bdg">
              Used in {usedInPrograms} program
              {usedInPrograms === 1 ? '' : 's'}
            </span>
            <span className="bdg mono">{exerciseIdLabel}</span>
          </div>
        </div>
      </div>

      <div className="ff">
        <label className="lbl">Instructions for members</label>
        {editingField === 'library_tip' ? (
          <div ref={instructionsRef}>
            <Textarea
              className="ta"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleSaveField('library_tip')}
              rows={3}
              placeholder="Describe the set-up, the movement, and what good execution feels like…"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleEdit('library_tip')}
            className="ta"
            style={{
              width: '100%',
              cursor: 'pointer',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              minHeight: 72,
            }}
          >
            {exercise.library_tip ||
              'Describe the set-up, the movement, and what good execution feels like…'}
          </button>
        )}
        <div className="hint">
          Shown under the video in the member app. Plain language, no clinical
          shorthand.
        </div>
      </div>

      <div className="ff">
        <div
          className="row"
          style={{ justifyContent: 'space-between', marginBottom: 4 }}
        >
          <label className="lbl" style={{ margin: 0 }}>
            Tags
          </label>
          <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
            Used for filtering and for building programs
          </span>
        </div>
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 14px',
            background: 'var(--surface-card)',
          }}
        >
          {tagGroups.map((group) => (
            <div key={group.id} className="tagrow">
              <span className="tl">{group.label}</span>
              <span className="tc">
                {group.tags.map((tag) => (
                  <span key={tag} className="tag tag-b">
                    {tag}
                    <button
                      type="button"
                      aria-label={`Remove ${tag}`}
                      onClick={() => handleRemoveTag(group.id, tag)}
                    >
                      <Icon name="X" size={13} strokeWidth={2.5} />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    height: 26,
                    padding: '0 9px',
                    fontSize: 'var(--text-xs)',
                  }}
                  onClick={() => undefined}
                >
                  <Icon name="Plus" size={13} />
                  Add
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="hint">
          Tags were pre-populated across the library on import. Add or remove
          them freely — this exercise is the source of truth.
        </div>
      </div>

      <div>
        <div
          className="row"
          style={{ justifyContent: 'space-between', marginBottom: 8 }}
        >
          <label className="lbl" style={{ margin: 0 }}>
            Check-in questions
          </label>
          <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
            Asked after every set
          </span>
        </div>
        <div className="list-rows" style={{ marginBottom: 10 }}>
          {checkInQuestions.map((q) => (
            <div
              key={q.id}
              className="row"
              style={{ gap: 11, padding: '10px 13px' }}
            >
              <Icon
                name="GripVertical"
                size={15}
                style={{ color: 'var(--slate-300)' }}
              />
              <span className="bdg" style={{ fontSize: 10 }}>
                {q.typeBadge}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-body)',
                }}
              >
                {q.text}
              </span>
              <button
                type="button"
                className="ib ib-sm"
                aria-label="Edit check-in"
                onClick={() => undefined}
              >
                <Icon name="SquarePen" size={15} />
              </button>
              <button
                type="button"
                className="ib ib-sm ib-dan"
                aria-label="Remove check-in"
                onClick={() => handleRemoveCheckIn(q.id)}
              >
                <Icon name="X" size={15} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-dash btn-sm"
          onClick={handleAddCheckIn}
        >
          <Icon name="Plus" size={15} />
          Add check-in question
        </button>
      </div>
    </HtmlModal>
  );
}
