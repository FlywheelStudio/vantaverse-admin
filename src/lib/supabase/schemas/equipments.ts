import { z } from 'zod';

export const equipmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  icon_url: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Equipment = z.infer<typeof equipmentSchema>;
