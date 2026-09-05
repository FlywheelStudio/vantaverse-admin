import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

export const appointmentSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  calendly_uri: z.string().nullable(),
  event_uri: z.string().nullable(),
  event_name: z.string().nullable(),
  invitee_name: z.string().nullable(),
  invitee_email: z.string().nullable(),
  status: z.enum(['scheduled', 'canceled', 'attended']),
  type: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  timezone: z.string().nullable(),
  canceled_by: z.string().nullable(),
  cancellation_reason: z.string().nullable(),
  reschedule_url: z.string().nullable(),
  cancel_url: z.string().nullable(),
  location_type: z.string().nullable(),
  location_value: z.string().nullable(),
  raw_payload: z.unknown().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

const appointmentListSchema = z.array(appointmentSchema);

export const appointmentKeys = {
  all: ['appointments'] as const,
  byUser: (userId: string) => [...appointmentKeys.all, 'user', userId] as const,
};

async function fetchAppointmentsByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: Appointment[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const parsed = appointmentListSchema.safeParse(data ?? []);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** All appointments for a user (service role). */
export const getAppointmentsByUserId = defineQuery({
  key: appointmentKeys.byUser,
  schema: appointmentListSchema,
  client: 'admin',
  execute: (client, userId: string) =>
    fetchAppointmentsByUserId(client, userId),
});
