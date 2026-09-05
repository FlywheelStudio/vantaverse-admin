import 'server-only';

import { mutate } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import { createClient } from '@/lib/supabase/core/server';
import {
  toLegacyResult,
  type SupabaseError,
  type SupabaseSuccess,
} from '../result';
import {
  getWorkoutScheduleById,
  getWorkoutScheduleDataByAssignmentId,
  upsertWorkoutScheduleMutation,
} from './workout-schedules';


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
