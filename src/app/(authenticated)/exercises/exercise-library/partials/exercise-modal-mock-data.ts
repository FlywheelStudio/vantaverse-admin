/** Mock option lists and defaults for Edit Exercise modal (HTML `mdExercise` parity). */

export const EXERCISE_SOURCE_OPTIONS = ['FMS', 'MedVanta', 'Partner'] as const;

export type ExerciseSource = (typeof EXERCISE_SOURCE_OPTIONS)[number];

interface ExerciseModalMocks {
  source: ExerciseSource;
  lastEditedBy: string;
}

const DEFAULT_LAST_EDITED_BY = 'Marcus Ellery';

export const MEDIA_OVERFLOW_ACTIONS = [
  { id: 'set-thumbnail', label: 'Set thumbnail frame' },
  { id: 'trim', label: 'Trim clip' },
  { id: 'download', label: 'Download original' },
  { id: 'remove', label: 'Remove media', danger: true },
] as const;

/**
 * Initial mock state for the edit exercise modal.
 */
export function createExerciseModalMocks(params: {
  typeHint?: string | null;
}): ExerciseModalMocks {
  const sourceFromType = params.typeHint?.trim().toUpperCase();
  const source: ExerciseSource =
    sourceFromType === 'FMS' ||
    sourceFromType === 'MEDVANTA' ||
    sourceFromType === 'PARTNER'
      ? (sourceFromType === 'MEDVANTA'
          ? 'MedVanta'
          : sourceFromType === 'PARTNER'
            ? 'Partner'
            : 'FMS')
      : 'FMS';

  return {
    source,
    lastEditedBy: DEFAULT_LAST_EDITED_BY,
  };
}
