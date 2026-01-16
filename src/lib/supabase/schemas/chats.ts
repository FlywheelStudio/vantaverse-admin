import { z } from 'zod';

export const chatSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  target_type: z.string(),
  organization_id: z.uuid().nullable(),
  team_id: z.uuid().nullable(),
  user_id: z.uuid().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  last_updated_at: z.string().nullable(),
  deleted_at: z.string().nullable(),
});

export type Chat = z.infer<typeof chatSchema>;
