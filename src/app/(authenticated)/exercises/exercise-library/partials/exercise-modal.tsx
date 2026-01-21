'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
}: ExerciseModalProps) {
  const updateExerciseMutation = useUpdateExercise();
  const [localExercise, setLocalExercise] = useState<Exercise | null>(
    exerciseProp,
  );
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
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
                className="bg-gray-800 text-white border-gray-700"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleEdit('exercise_name')}
                className="cursor-pointer hover:text-blue-400 transition-colors"
              >
                {exercise.exercise_name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Video Player */}
        {videoUrl && (
          <div className="relative aspect-video w-full max-w-2xl mx-auto overflow-hidden rounded-lg bg-black">
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
          </div>
        )}

        {/* Instructions Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Instructions</h3>
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
              className="bg-gray-800 text-white border-gray-700 min-h-[100px]"
              autoFocus
            />
          ) : (
            <p
              onClick={() => handleEdit('library_tip')}
              className="text-white cursor-pointer hover:text-blue-400 transition-colors whitespace-pre-wrap"
            >
              {exercise.library_tip || 'Click to add instructions'}
            </p>
          )}
        </div>

        {/* Common Modifications Section */}
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white">Common Modifications</h3>
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
              className="bg-gray-800 text-white border-gray-700 min-h-[100px]"
              autoFocus
            />
          ) : (
            <p
              onClick={() => handleEdit('library_check_in_question')}
              className="text-white cursor-pointer hover:text-blue-400 transition-colors whitespace-pre-wrap"
            >
              {exercise.library_check_in_question ||
                'Click to add common modifications'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
