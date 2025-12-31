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
});

export type Organization = z.infer<typeof organizationSchema>;
