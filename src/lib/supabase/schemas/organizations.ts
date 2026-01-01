import { z } from 'zod';

const organizationMemberSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  profile: z
    .object({
      id: z.string(),
      avatar_url: z.string().nullable(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      username: z.string().nullable(),
    })
    .nullable(),
});

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
  members: z.array(organizationMemberSchema).optional(),
});

export type Organization = z.infer<typeof organizationSchema>;
