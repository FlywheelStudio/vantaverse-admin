import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
  formatDalError,
  mutate,
  type DalResult,
} from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/core/server';

import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import { formatScheduleDB } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import { type SupabaseError, type SupabaseSuccess } from '../result';

const workoutScheduleResultSchema = z.object({
  id: z.string().uuid(),
  schedule_hash: z.string(),
});

const schedulePayloadSchema = z.object({
  schedule: z.unknown(),
});

const scheduleDataSchema = z.object({
  schedule: z.unknown(),
  patientOverride: z.unknown(),
});

const upsertWorkoutScheduleInputSchema = z.object({
  schedule: z.custom<DatabaseSchedule>(),
  notes: z.string().optional(),
});

export const workoutScheduleKeys = {
  all: ['workout-schedules'] as const,
  detail: (id: string) => [...workoutScheduleKeys.all, 'detail', id] as const,
  byAssignment: (assignmentId: string) =>
    [...workoutScheduleKeys.all, 'assignment', assignmentId] as const,
};

function parseRpcEnvelope(
  result: unknown,
  fallbackMessage: string,
): { data: unknown; error: { message: string } | null } {
  if (!result || (result as { success?: boolean }).success === false) {
    const errorResult = result as { message?: string; error?: string };
    return {
      data: null,
      error: {
        message:
          errorResult.message || errorResult.error || fallbackMessage,
      },
    };
  }

  return { data: result, error: null };
}

async function fetchScheduleById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{
  data: { schedule: unknown } | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: workoutSchedule, error } = await client
    .from('workout_schedules')
    .select('schedule')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!workoutSchedule) {
    return { data: null, error: null };
  }

  return {
    data: { schedule: workoutSchedule.schedule as unknown },
    error: null,
  };
}

/** Workout schedule row by id. */
export const getWorkoutScheduleById = defineQuery({
  key: workoutScheduleKeys.detail,
  schema: schedulePayloadSchema.nullable(),
  execute: (client, id: string) => fetchScheduleById(client, id),
});

/** Assignment schedule + patient override (service role). */
export const getWorkoutScheduleDataByAssignmentId = defineQuery({
  key: workoutScheduleKeys.byAssignment,
  schema: scheduleDataSchema,
  client: 'admin',
  execute: async (client, programAssignmentId: string) => {
    const { data: assignment, error: assignmentError } = await client
      .from('program_assignment')
      .select('workout_schedule_id, patient_override')
      .eq('id', programAssignmentId)
      .maybeSingle();

    if (assignmentError) {
      return { data: null, error: assignmentError };
    }

    if (!assignment) {
      return {
        data: null,
        error: { message: 'Program assignment not found' },
      };
    }

    let schedule: unknown = null;
    if (assignment.workout_schedule_id) {
      const scheduleResult = await fetchScheduleById(
        client,
        assignment.workout_schedule_id,
      );

      if (scheduleResult.error) {
        return { data: null, error: scheduleResult.error };
      }

      schedule = scheduleResult.data?.schedule ?? null;
    }

    return {
      data: {
        schedule,
        patientOverride: assignment.patient_override as unknown,
      },
      error: null,
    };
  },
});

/** Upsert workout schedule via RPC. */
export const upsertWorkoutScheduleMutation = defineMutation({
  inputSchema: upsertWorkoutScheduleInputSchema,
  schema: workoutScheduleResultSchema,
  execute: async (client, input) => {
    const schedule3D = formatScheduleDB(input.schedule);
    type RpcArgs =
      Database['public']['Functions']['upsert_workout_schedule']['Args'];
    const { data: result, error } = await client.rpc('upsert_workout_schedule', {
      p_schedule: schedule3D as RpcArgs['p_schedule'],
      p_notes: input.notes,
    });

    if (error) {
      return { data: null, error };
    }

    return parseRpcEnvelope(result, 'Failed to upsert workout schedule');
  },
  targets: () => [workoutScheduleKeys.all],
});

function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

/** Legacy facade for callers outside Wave B scope. */
export class WorkoutSchedulesQuery {
  public async upsertWorkoutSchedule(
    schedule: DatabaseSchedule,
    notes?: string,
  ): Promise<
    SupabaseSuccess<{ id: string; schedule_hash: string }> | SupabaseError
  > {
    const client = await createClient();
    return toLegacyResult(
      await mutate(
        upsertWorkoutScheduleMutation,
        { schedule, notes },
        { client },
      ),
    );
  }

  public async getScheduleById(
    id: string,
  ): Promise<
    SupabaseSuccess<{ schedule: unknown } | null> | SupabaseError
  > {
    return toLegacyResult(await queryWithSession(getWorkoutScheduleById, id));
  }

  public async getScheduleDataByAssignmentId(
    programAssignmentId: string,
  ): Promise<
    | SupabaseSuccess<{
        schedule: unknown;
        patientOverride: unknown;
      }>
    | SupabaseError
  > {
    return toLegacyResult(
      await queryWithSession(
        getWorkoutScheduleDataByAssignmentId,
        programAssignmentId,
      ),
    );
  }
}
