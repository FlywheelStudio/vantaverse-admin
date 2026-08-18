/** Mock option lists and defaults for Edit Exercise modal (HTML `mdExercise` parity). */

export const EXERCISE_CATEGORY_OPTIONS = [
  'Core',
  'Mobility',
  'Strength',
  'Balance',
] as const;

export const EXERCISE_SOURCE_OPTIONS = [
  'FMS',
  'MedVanta',
  'Partner',
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORY_OPTIONS)[number];
export type ExerciseSource = (typeof EXERCISE_SOURCE_OPTIONS)[number];

export type TagGroupId =
  | 'equipment'
  | 'body_region'
  | 'muscle'
  | 'pattern';

export interface TagGroup {
  id: TagGroupId;
  label: string;
  tags: string[];
}

export interface MockPrescription {
  sets: string;
  reps: string;
  rest: string;
}

export interface MockCheckInQuestion {
  id: string;
  typeBadge: string;
  text: string;
}

export interface ExerciseModalMocks {
  category: ExerciseCategory;
  source: ExerciseSource;
  prescription: MockPrescription;
  tagGroups: TagGroup[];
  checkInQuestions: MockCheckInQuestion[];
  lastEditedBy: string;
}

export const DEFAULT_PRESCRIPTION: MockPrescription = {
  sets: '2',
  reps: '8',
  rest: '45s',
};

export const DEFAULT_TAG_GROUPS: TagGroup[] = [
  { id: 'equipment', label: 'Equipment', tags: ['Foam roller', 'Mat'] },
  { id: 'body_region', label: 'Body region', tags: ['Core', 'Upper body'] },
  {
    id: 'muscle',
    label: 'Muscle groups',
    tags: ['Obliques', 'Transverse abdominis'],
  },
  {
    id: 'pattern',
    label: 'Pattern',
    tags: ['Anti-rotation', 'Isometric'],
  },
];

export const DEFAULT_CHECK_IN_QUESTIONS: MockCheckInQuestion[] = [
  {
    id: 'ci-pain',
    typeBadge: 'Scale 0–10',
    text: 'Rate your pain during this movement (0–10)',
  },
  {
    id: 'ci-lower-back',
    typeBadge: 'Yes / No',
    text: 'Did you feel this in your lower back?',
  },
];

export const DEFAULT_LAST_EDITED_BY = 'Marcus Ellery';

export const MEDIA_OVERFLOW_ACTIONS = [
  { id: 'set-thumbnail', label: 'Set thumbnail frame' },
  { id: 'trim', label: 'Trim clip' },
  { id: 'download', label: 'Download original' },
  { id: 'remove', label: 'Remove media', danger: true },
] as const;

/**
 * Builds structured check-in rows, preferring existing library text as the first row.
 */
export function buildCheckInQuestions(
  existingText: string | null | undefined,
): MockCheckInQuestion[] {
  const trimmed = existingText?.trim();
  if (!trimmed) return DEFAULT_CHECK_IN_QUESTIONS.map((q) => ({ ...q }));

  return [
    {
      id: 'ci-existing',
      typeBadge: 'Scale 0–10',
      text: trimmed,
    },
    ...DEFAULT_CHECK_IN_QUESTIONS.slice(1).map((q) => ({ ...q })),
  ];
}

/**
 * Initial mock state for the edit exercise modal.
 */
export function createExerciseModalMocks(params: {
  existingCheckIn?: string | null;
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
    category: 'Core',
    source,
    prescription: { ...DEFAULT_PRESCRIPTION },
    tagGroups: DEFAULT_TAG_GROUPS.map((g) => ({
      ...g,
      tags: [...g.tags],
    })),
    checkInQuestions: buildCheckInQuestions(params.existingCheckIn),
    lastEditedBy: DEFAULT_LAST_EDITED_BY,
  };
}
