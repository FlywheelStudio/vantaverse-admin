import { z } from 'zod';

export const organizationSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  picture_url: z.string().nullable(),
  is_active: z.boolean().nullable(),
  is_super_admin: z.boolean().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  members_count: z.number().optional(),
  member_ids: z.array(z.string()).optional(),
});

export type Organization = z.infer<typeof organizationSchema>;
