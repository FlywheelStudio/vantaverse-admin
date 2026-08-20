import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type {
  ExerciseTemplate,
  Group,
} from '@/lib/supabase/schemas/exercise-templates';
import type { DayPrescription } from '@/app/(authenticated)/builder/[id]/workout-schedule/exercise-builder-mock-data';

export type SelectedItem =
  | { type: 'exercise'; data: Exercise; prescription?: DayPrescription }
  | { type: 'template'; data: ExerciseTemplate; prescription?: DayPrescription }
  | {
      type: 'group';
      data: Group;
    };

export interface TemplateConfigProps {
  item: Exclude<SelectedItem, { type: 'group' }> | null;
  position: { x: number; y: number };
  onClose: () => void;
  copiedData: Partial<ExerciseTemplate> | null;
  onCopy: (data: Partial<ExerciseTemplate>) => void;
  onUpdate?: (data: Partial<ExerciseTemplate>) => void;
  onSuccessWithTemplate?: (template: ExerciseTemplate) => void;
  onSaveStart?: () => void;
}

export type TabType = 'all' | 'set';
