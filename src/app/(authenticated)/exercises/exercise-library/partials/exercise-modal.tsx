'use client';

import { useState, useRef, useEffect } from 'react';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import {
  Dialog,
  FormField,
  Icon,
  Input,
  Textarea,
} from '@/components/medvanta';
import { useUpdateExercise } from '@/hooks/use-exercise-mutations';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface ExerciseModalProps {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditableField =
  | 'exercise_name'
  | 'library_tip'
  | 'library_check_in_question';

export function ExerciseModal({
  exercise: exerciseProp,
  open,
  onOpenChange,
}: ExerciseModalProps): React.ReactElement | null {
  const updateExerciseMutation = useUpdateExercise();
  const [localExercise, setLocalExercise] = useState<Exercise | null>(
    exerciseProp,
  );
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showVideo, setShowVideo] = useState(false);
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

  if (!localExercise) return null;

  const exercise = localExercise;

  const handleEdit = (field: EditableField): void => {
    if (updateExerciseMutation.isPending) return;
    const value =
      field === 'exercise_name'
        ? exercise.exercise_name
        : field === 'library_tip'
          ? exercise.library_tip || ''
          : exercise.library_check_in_question || '';
    setEditingField(field);
    setEditingValue(value);
  };

  const handleSave = (field: EditableField): void => {
    if (updateExerciseMutation.isPending) return;

    const originalValue =
      field === 'exercise_name'
        ? exercise.exercise_name
        : field === 'library_tip'
          ? exercise.library_tip
          : exercise.library_check_in_question;

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
        <Input
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={() => handleSave('exercise_name')}
        />
      </div>
    ) : (
      <button
        type="button"
        onClick={() => handleEdit('exercise_name')}
        className="cursor-pointer text-left transition-colors hover:text-[var(--primary)]"
      >
        {exercise.exercise_name}
      </button>
    );

  return (
    <Dialog
      open={open}
      title={titleContent}
      onClose={() => onOpenChange(false)}
      width={896}
      className="max-h-[90vh] overflow-y-auto"
    >
      {videoUrl ? (
        <div className="relative mx-auto mb-6 aspect-video w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] bg-[var(--slate-100)]">
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
              <button
                type="button"
                onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_oklch,var(--navy-950)_30%,transparent)] transition-colors hover:bg-[color-mix(in_oklch,var(--navy-950)_40%,transparent)]"
                aria-label="Play video"
              >
                <span className="rounded-[var(--radius-pill)] bg-[var(--primary)] p-4 text-[var(--text-inverse)] shadow-[var(--shadow-md)]">
                  <Icon name="Play" size={32} className="fill-current" />
                </span>
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
      ) : null}

      <FormField label="Instructions">
        {editingField === 'library_tip' ? (
          <div ref={instructionsRef}>
            <Textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleSave('library_tip')}
              rows={4}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleEdit('library_tip')}
            className="w-full cursor-pointer whitespace-pre-wrap rounded-[var(--radius-md)] px-3 py-2 text-left text-[length:var(--text-sm)] text-[var(--text-body)] transition-colors hover:bg-[var(--slate-50)] hover:text-[var(--primary)]"
          >
            {exercise.library_tip || 'Click to add instructions'}
          </button>
        )}
      </FormField>

      <FormField label="Check-in Questions" className="mt-4">
        {editingField === 'library_check_in_question' ? (
          <div ref={checkInRef}>
            <Textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleSave('library_check_in_question')}
              rows={4}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleEdit('library_check_in_question')}
            className="w-full cursor-pointer whitespace-pre-wrap rounded-[var(--radius-md)] px-3 py-2 text-left text-[length:var(--text-sm)] text-[var(--text-body)] transition-colors hover:bg-[var(--slate-50)] hover:text-[var(--primary)]"
          >
            {exercise.library_check_in_question ||
              'Click to add check-in questions'}
          </button>
        )}
      </FormField>
    </Dialog>
  );
}
