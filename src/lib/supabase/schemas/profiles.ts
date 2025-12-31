import { z } from 'zod';
import { Database } from '../database.types';

const journeyPhaseValues = [
  'discovery',
  'onboarding',
  'scaffolding',
] as const satisfies readonly Database['public']['Enums']['journey_phase'][];

export const journeyPhaseSchema = z.enum(journeyPhaseValues, {
  message: 'Invalid journey phase',
});

export const profileSchema = z.object({
  id: z.uuid(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.email().nullable(),
  phone: z.string().nullable(),
  journey_phase: journeyPhaseSchema.nullable(),
  screening_completed: z.boolean().nullable(),
  intro_completed: z.boolean().nullable(),
  consultation_completed: z.boolean().nullable(),
  program_assigned: z.boolean().nullable(),
  program_started: z.boolean().nullable(),
  program_due_date: z.string().nullable(),
  avatar_url: z.string().nullable(),
  certificate_url: z.any().nullable(),
  timezone: z.string().nullable(),
  last_sign_in_at_testing: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type JourneyPhase = z.infer<typeof journeyPhaseSchema>;
export type Profile = z.infer<typeof profileSchema>;
