import { z } from 'zod';
import { Database } from '../database.types';

const organizationRoleValues = [
  'admin',
  'member',
  'patient',
] as const satisfies readonly Database['public']['Enums']['organization_role'][];

export const organizationMemberRoleSchema = z.enum(organizationRoleValues, {
  message: 'Invalid organization role',
});

export const organizationMemberSchema = z.object({
  role: organizationMemberRoleSchema,
});

export type OrganizationMemberRole = z.infer<
  typeof organizationMemberRoleSchema
>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;
