'use client';

import { useState, useRef, useEffect } from 'react';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import { Icon, Textarea } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { useUpdateExercise } from '@/hooks/use-exercise-mutations';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import { formatDistanceToNow } from 'date-fns';
import { ExerciseTagsSection } from './exercise-tags-section';

interface ExerciseModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditableField =
  | 'exercise_name'
  | 'library_tip'
  | 'library_check_in_question';

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
  const [localExercise, setLocalExercise] = useState<Exercise>(exerciseProp);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showVideo, setShowVideo] = useState(false);
  const updateExerciseMutation = useUpdateExercise();
  const source = exerciseProp.type ? formatTypeLabel(exerciseProp.type) : 'MedVanta';
  const lastEditedTime = getRelativeTimeDisplay(exerciseProp.updated_at || exerciseProp.created_at);
  const titleRef = useRef<HTMLDivElement>(null);
  const instructionsRef = useRef<HTMLDivElement>(null);
  const checkInRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editingField === 'exercise_name') {
      titleRef.current?.querySelector('input')?.focus();
    } else if (editingField === 'library_tip') {
      instructionsRef.current?.querySelector('textarea')?.focus();
    } else if (editingField === 'library_check_in_question') {
      checkInRef.current?.querySelector('textarea')?.focus();
    }
  }, [editingField]);

  const exercise = localExercise;
  const usedInPrograms = exercise.assigned_count ?? 0;
  const isUnassigned = usedInPrograms === 0;
  const exerciseIdLabel = `ID EX-${exercise.id}`;

  const getFieldValue = (field: EditableField): string => {
    if (field === 'exercise_name') return exercise.exercise_name;
    if (field === 'library_tip') return exercise.library_tip || '';
    return exercise.library_check_in_question || '';
  };

  const handleEdit = (field: EditableField): void => {
    if (updateExerciseMutation.isPending) return;
    setEditingField(field);
    setEditingValue(getFieldValue(field));
  };

  const handleSaveField = (field: EditableField): void => {
    if (updateExerciseMutation.isPending) return;

    const originalValue =
      field === 'exercise_name' ? exercise.exercise_name : getFieldValue(field);

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
      footerInfo={`Last edited ${lastEditedTime}`}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-acc"
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

        </div>

        <div>
          <div className="ff">
            <label className="lbl">
              Exercise name<span className="req">*</span>
            </label>
            {titleContent}
          </div>

          <div className="ff">
            <label className="lbl">Source</label>
            <span className="fld ro">
              <input value={source} readOnly disabled aria-label="Source" />
            </span>
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
        <div className="hint">
          Shown under the video in the member app. Plain language, no clinical
          shorthand.
        </div>
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
      </div>

      <div className="ff">
        <label className="lbl">Check-in question</label>
        <div className="hint">
          Asked after every set. Plain language, no clinical shorthand.
        </div>
        {editingField === 'library_check_in_question' ? (
          <div ref={checkInRef}>
            <Textarea
              className="ta"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleSaveField('library_check_in_question')}
              rows={3}
              placeholder="e.g. Rate your pain during this movement (0–10)"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleEdit('library_check_in_question')}
            className="ta"
            style={{
              width: '100%',
              cursor: 'pointer',
              textAlign: 'left',
              whiteSpace: 'pre-wrap',
              minHeight: 72,
            }}
          >
            {exercise.library_check_in_question ||
              'e.g. Rate your pain during this movement (0–10)'}
          </button>
        )}
      </div>

      <ExerciseTagsSection exerciseId={exercise.id} />
    </HtmlModal>
  );
}
