import { z } from 'zod';

export const programTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  weeks: z.number(),
  coming_soon_weeks: z.number().int().min(0).default(0),
  goals: z.string().nullable(),
  image_url: z.unknown().nullable(),
  organization_id: z.string().nullable(),
  active: z.boolean().nullable(),
  notes: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type ProgramTemplate = z.infer<typeof programTemplateSchema>;
