import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { z } from 'zod';

// Appointment schema based on database structure
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
  raw_payload: z.any().nullable(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export class AppointmentsQuery extends SupabaseQuery {
  /**
   * Get all appointments for a user by ID
   * @param userId - The user ID to fetch appointments for
   * @returns Success with appointments array or error
   */
  public async getAppointmentsByUserId(
    userId: string,
  ): Promise<SupabaseSuccess<Appointment[]> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get appointments',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    const result = appointmentSchema.array().safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
