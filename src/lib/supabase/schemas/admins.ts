import { z } from 'zod';
import { organizationMemberRoleSchema } from './organization-members';

/**
 * Slim admin profile matching `profiles_admins` (+ shell enrichment fields).
 */
export const adminProfileSchema = z.object({
  id: z.uuid(),
  description: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  status: z.enum(['pending', 'invited', 'active', 'assigned']).nullish(),
  phone: z.string().nullable(),
  avatar_url: z.string().nullable(),
  timezone: z.string().nullish(),
  last_sign_in: z.string().nullish(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  area_code: z.string().nullable().optional(),
  email_notifications: z.boolean().optional(),
  first_login: z.string().nullable().optional(),
  pushfire_subscriber_id: z.string().nullable().optional(),
  /** Enriched from super-admin org membership — not a DB column. */
  is_super_admin: z.boolean().optional(),
  orgMemberships: z
    .array(z.object({ orgId: z.string(), orgName: z.string() }))
    .optional(),
  role: organizationMemberRoleSchema.optional(),
});

export type AdminProfile = z.infer<typeof adminProfileSchema>;

/** Facet counts from `get_admin_filter_counts`. */
export interface AdminFilterCounts {
  roles: { patient: number; admin: number };
  status: {
    pending: number;
    invited: number;
    active: number;
    assigned: number;
  };
}
