import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';

export type SelectedItem =
  | { type: 'exercise'; data: Exercise }
  | { type: 'template'; data: ExerciseTemplate };

export interface TemplateConfigProps {
  item: SelectedItem | null;
  position: { x: number; y: number };
  onClose: () => void;
  onSave: (data: Partial<ExerciseTemplate>) => Promise<void>;
  copiedData: Partial<ExerciseTemplate> | null;
  onCopy: (data: Partial<ExerciseTemplate>) => void;
  onPaste: () => void;
}

export type TabType = 'all' | 'set';

export interface TemplateFormData {
  sets: number;
  rep: number | null;
  time: number | null;
  distance: string | null;
  distanceUnit: string;
  weight: string | null;
  weightUnit: string;
  rest_time: number | null;
  rep_override: (number | null)[];
  time_override: (number | null)[];
  distance_override: (string | null)[];
  distance_override_units: string[];
  weight_override: (string | null)[];
  weight_override_units: string[];
  rest_time_override: (number | null)[];
}
