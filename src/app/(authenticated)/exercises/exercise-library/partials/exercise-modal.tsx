'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateExercise } from '@/hooks/use-exercise-mutations';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import { Play } from 'lucide-react';

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
}: ExerciseModalProps) {
  const updateExerciseMutation = useUpdateExercise();
  const [localExercise, setLocalExercise] = useState<Exercise | null>(
    exerciseProp,
  );
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [showVideo, setShowVideo] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingField && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [editingField]);

  if (!localExercise) return null;

  const exercise = localExercise;

  const handleEdit = (field: EditableField) => {
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

  const handleSave = (field: EditableField) => {
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

      // Update local state immediately for UI feedback
      setLocalExercise((prev) =>
        prev ? { ...prev, [field]: normalizedNew || null } : prev,
      );

      // Trigger mutation (optimistic update handles query cache)
      updateExerciseMutation.mutate({
        id: exercise.id,
        data: updateData,
      });
    }

    setEditingField(null);
    setEditingValue('');
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const getVideoUrl = () => {
    if (exercise.video_type === 'youtube' && exercise.video_url) {
      return `https://www.youtube.com/embed/${exercise.video_url}`;
    }
    if (exercise.video_type === 'file' && exercise.video_url) {
      return exercise.video_url;
    }
    return null;
  };

  const videoUrl = getVideoUrl();
  const thumb = exercise.thumbnail_url && typeof exercise.thumbnail_url === 'object' ? exercise.thumbnail_url : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[var(--radius-2xl)] border-border bg-card p-6 shadow-[var(--shadow-hero)] sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {editingField === 'exercise_name' ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleSave('exercise_name')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancel();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave('exercise_name');
                  }
                }}
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleEdit('exercise_name')}
                className="cursor-pointer transition-colors hover:text-primary"
              >
                {exercise.exercise_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Video Player: poster (blurhash → image) then video on play */}
        {videoUrl && (
          <div className="bg-muted relative mx-auto aspect-video w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)]">
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
                  className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors hover:bg-black/40"
                  aria-label="Play video"
                >
                  <span className="rounded-full bg-primary p-4 text-primary-foreground shadow-lg">
                    <Play className="h-8 w-8" fill="currentColor" />
                  </span>
                </button>
              </>
            ) : (
              <>
                {exercise.video_type === 'youtube' ? (
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
              </>
            )}
          </div>
        )}

        {/* Instructions Section */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Instructions</h3>
          {editingField === 'library_tip' ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleSave('library_tip')}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave('library_tip');
                }
              }}
              className="min-h-[7.5rem]"
              autoFocus
            />
          ) : (
            <p
              onClick={() => handleEdit('library_tip')}
              className="hover:bg-muted/60 cursor-pointer whitespace-pre-wrap rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors hover:text-primary"
            >
              {exercise.library_tip || 'Click to add instructions'}
            </p>
          )}
        </div>

        {/* Check-in Questions Section */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold">Check-in Questions</h3>
          {editingField === 'library_check_in_question' ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={() => handleSave('library_check_in_question')}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancel();
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave('library_check_in_question');
                }
              }}
              className="min-h-[7.5rem]"
              autoFocus
            />
          ) : (
            <p
              onClick={() => handleEdit('library_check_in_question')}
              className="hover:bg-muted/60 cursor-pointer whitespace-pre-wrap rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors hover:text-primary"
            >
              {exercise.library_check_in_question ||
                'Click to add check-in questions'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
