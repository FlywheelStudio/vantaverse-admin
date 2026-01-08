import { z } from 'zod';
import { programTemplateSchema } from './program-templates';

export const programAssignmentSchema = z.object({
  id: z.string(),
  user_id: z.string().nullable(),
  organization_id: z.string().nullable(),
  program_template_id: z.string(),
  workout_schedule_id: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  status: z.string().nullable(),
  completion: z.unknown().nullable(),
  patient_override: z.unknown().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type ProgramAssignment = z.infer<typeof programAssignmentSchema>;

// Combined type that includes both assignment and template data
export const programAssignmentWithTemplateSchema =
  programAssignmentSchema.extend({
    program_template: programTemplateSchema,
  });

export type ProgramAssignmentWithTemplate = z.infer<
  typeof programAssignmentWithTemplateSchema
>;
