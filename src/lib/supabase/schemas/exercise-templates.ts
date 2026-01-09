import { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { z } from 'zod';

export const exerciseTemplateSchema = z.object({
  id: z.string(),
  template_hash: z.string(),
  exercise_id: z.number(),
  notes: z.string().nullable(),
  sets: z.number().nullable(),
  time: z.number().nullable(),
  rep: z.number().nullable(),
  distance: z.string().nullable(),
  weight: z.string().nullable(),
  rest_time: z.number().nullable(),
  equipment_ids: z.array(z.number()).nullable(),
  rep_override: z.array(z.number()).nullable(),
  time_override: z.array(z.number()).nullable(),
  distance_override: z.array(z.string()).nullable(),
  weight_override: z.array(z.string()).nullable(),
  rest_time_override: z.array(z.number()).nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  // Joined exercise data
  exercise_name: z.string().optional(),
  video_type: z.string().optional(),
  video_url: z.string().nullable().optional(),
});

export type ExerciseTemplate = z.infer<typeof exerciseTemplateSchema>;
export type Group = {
  name: string;
  isSuperset: boolean;
  items: SelectedItem[];
};
