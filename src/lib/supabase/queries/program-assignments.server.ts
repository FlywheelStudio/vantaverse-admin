import 'server-only';

import { formatDalError, mutate, query } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';
import { createClient } from '@/lib/supabase/core/server';
import {
  toLegacyResult,
  voidFromDeleteResult,
  type SupabaseError,
  type SupabaseSuccess,
} from '../result';
import {
  type ProgramAssignment,
  type ProgramAssignmentMember,
  type ProgramAssignmentWithTemplate,
} from '../schemas/program-assignments';
import type { ProgramTemplate } from '../schemas/program-templates';
import { getExerciseTemplatesByIds } from './exercise-templates';
import { getGroupsByIds } from './groups';
import { createProgramTemplate } from './program-templates';
import {
  assignProgramToUser,
  clearProgramAssignmentDatesByTemplateId,
  createProgramAssignment,
  deleteProgramAssignment,
  deleteProgramRpc,
  getActiveProgramAssignmentByUserId,
  getProgramAssignmentById,
  getProgramAssignmentByTemplateId,
  getProgramAssignmentComplianceByUserId,
  getProgramAssignmentListPaginated,
  getProgramAssignmentMemberStatsByTemplateIds,
  getProgramAssignmentMembersByTemplateId,
  getProgramAssignmentTemplates,
  getProgramAssignmentTemplatesPaginated,
  getProgramAssignmentWorkoutScheduleFields,
  getPreProgramTemplateAssignment,
  updateDerivedProgramAssignmentSchedule,
  updateProgramAssignmentDatesByIds,
  updateProgramAssignmentDatesByTemplateId,
  updateProgramAssignmentWorkoutScheduleId,
} from './program-assignments';

/** Legacy facade for callers outside Wave B scope. */
export class ProgramAssignmentsQuery {
  public async getTemplates(): Promise<
    SupabaseSuccess<ProgramAssignmentWithTemplate[]> | SupabaseError
  > {
    return toLegacyResult(
      await queryWithSession(getProgramAssignmentTemplates),
    );
  }

  public async getTemplatesPaginated(
    page: number = 1,
    pageSize: number = 16,
    search?: string,
    weeks?: number,
    showAssigned: boolean = false,
  ): Promise<
    | SupabaseSuccess<{
        data: ProgramAssignmentWithTemplate[];
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
        memberStats: Record<
          string,
          { members: number; avgCompletion: number | null }
        >;
      }>
    | SupabaseError
  > {
    return toLegacyResult(
      await query(getProgramAssignmentTemplatesPaginated, {
        page,
        pageSize,
        search,
        weeks,
        showAssigned,
      }),
    );
  }

  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<ProgramAssignmentWithTemplate> | SupabaseError> {
    return toLegacyResult(await query(getProgramAssignmentById, id));
  }

  public async create(
    programTemplateId: string,
    startDate: string | null,
    endDate: string | null,
    organizationId?: string | null,
    workoutScheduleId?: string | null,
  ): Promise<SupabaseSuccess<ProgramAssignment> | SupabaseError> {
    const client = await createClient();
    return toLegacyResult(
      await mutate(
        createProgramAssignment,
        {
          programTemplateId,
          startDate,
          endDate,
          organizationId,
          workoutScheduleId,
        },
        { client },
      ),
    );
  }

  public async getPreProgramTemplate(): Promise<
    SupabaseSuccess<ProgramAssignmentWithTemplate | null> | SupabaseError
  > {
    return toLegacyResult(
      await queryWithSession(getPreProgramTemplateAssignment),
    );
  }

  public async cloneToTemplate(assignmentId: string): Promise<
    | SupabaseSuccess<{
        template: ProgramTemplate;
        assignment: ProgramAssignment;
      }>
    | SupabaseError
  > {
    const sourceResult = await this.getById(assignmentId);
    if (!sourceResult.success) return sourceResult;

    const source = sourceResult.data;
    if (!source.program_template) {
      return {
        success: false,
        error: 'Program template not found',
      };
    }

    if (source.status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE) {
      return {
        success: false,
        error: 'Cannot clone the Pre-Program template',
      };
    }

    const template = source.program_template;
    const client = await createClient();
    const templateResult = toLegacyResult(
      await mutate(
        createProgramTemplate,
        {
          name: `${template.name} (clone)`,
          weeks: template.weeks,
          description: template.description ?? null,
          goals: template.goals ?? null,
          notes: template.notes ?? null,
          organizationId: source.organization_id ?? template.organization_id ?? null,
          imageUrl:
            template.image_url != null ? String(template.image_url) : null,
        },
        { client },
      ),
    );

    if (!templateResult.success) return templateResult;

    const assignmentResult = await this.create(
      templateResult.data.id,
      null,
      null,
      source.organization_id ?? null,
      source.workout_schedule_id ?? null,
    );

    if (!assignmentResult.success) return assignmentResult;

    return {
      success: true,
      data: {
        template: templateResult.data,
        assignment: assignmentResult.data,
      },
    };
  }

  public async getByTemplateId(
    programTemplateId: string,
  ): Promise<SupabaseSuccess<ProgramAssignment | null> | SupabaseError> {
    return toLegacyResult(
      await queryWithSession(
        getProgramAssignmentByTemplateId,
        programTemplateId,
      ),
    );
  }

  public async getMembersByTemplateId(
    programTemplateId: string,
  ): Promise<SupabaseSuccess<ProgramAssignmentMember[]> | SupabaseError> {
    return toLegacyResult(
      await query(getProgramAssignmentMembersByTemplateId, programTemplateId),
    );
  }

  public async delete(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const client = await createClient();
    return voidFromDeleteResult(
      await mutate(deleteProgramAssignment, { id }, { client }),
    );
  }

  public async updateDatesByTemplateId(
    templateId: string,
    startDate: string,
    endDate: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    return voidFromDeleteResult(
      await mutate(updateProgramAssignmentDatesByTemplateId, {
        templateId,
        startDate,
        endDate,
      }),
    );
  }

  public async clearDatesByTemplateId(
    templateId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    return voidFromDeleteResult(
      await mutate(clearProgramAssignmentDatesByTemplateId, { templateId }),
    );
  }

  public async updateDatesByIds(
    ids: string[],
    startDate: string,
    endDate: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    return voidFromDeleteResult(
      await mutate(updateProgramAssignmentDatesByIds, {
        ids,
        startDate,
        endDate,
      }),
    );
  }

  public async updateWorkoutScheduleId(
    assignmentId: string,
    workoutScheduleId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    return voidFromDeleteResult(
      await mutate(updateProgramAssignmentWorkoutScheduleId, {
        assignmentId,
        workoutScheduleId,
      }),
    );
  }

  public async getWorkoutScheduleFields(assignmentId: string): Promise<
    | SupabaseSuccess<{
        workout_schedule_id: string | null;
        patient_override: unknown;
      }>
    | SupabaseError
  > {
    return toLegacyResult(
      await queryWithSession(
        getProgramAssignmentWorkoutScheduleFields,
        assignmentId,
      ),
    );
  }

  public async getComplianceByUserId(
    userId: string,
  ): Promise<SupabaseSuccess<number | null> | SupabaseError> {
    return toLegacyResult(
      await queryWithSession(getProgramAssignmentComplianceByUserId, userId),
    );
  }

  public async getMemberStatsByTemplateIds(
    templateIds: string[],
  ): Promise<
    SupabaseSuccess<
      Record<string, { members: number; avgCompletion: number | null }>
    >
    | SupabaseError
  > {
    return toLegacyResult(
      await query(getProgramAssignmentMemberStatsByTemplateIds, templateIds),
    );
  }

  public async getActiveByUserId(userId: string): Promise<
    | SupabaseSuccess<{
        assignment: ProgramAssignmentWithTemplate | null;
        exerciseNamesMap: Map<string, string>;
        groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
      }>
    | SupabaseError
  > {
    const assignmentResult = await query(
      getActiveProgramAssignmentByUserId,
      userId,
    );
    const [err, assignment] = assignmentResult;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }

    if (!assignment) {
      return {
        success: true,
        data: {
          assignment: null,
          exerciseNamesMap: new Map(),
          groupsMap: new Map(),
        },
      };
    }

    const workoutSchedule = assignment.workout_schedule;
    const exerciseTemplateIds =
      (workoutSchedule?.exercise_template_ids as string[] | null) ?? [];
    const groupIds = (workoutSchedule?.group_ids as string[] | null) ?? [];

    const groupsDalResult = await query(getGroupsByIds, groupIds);
    const [groupsErr, groupsData] = groupsDalResult;
    const groupsResult = groupsErr
      ? { success: false as const, error: formatDalError(groupsErr) }
      : { success: true as const, data: new Map(Object.entries(groupsData)) };

    const exerciseTemplateIdsFromGroups: string[] = [];
    const groupsMap = new Map<
      string,
      { exercise_template_ids: string[] | null }
    >();

    if (groupsResult.success) {
      for (const [groupId, group] of groupsResult.data) {
        groupsMap.set(groupId, {
          exercise_template_ids: group.exercise_template_ids,
        });
        if (group.exercise_template_ids) {
          exerciseTemplateIdsFromGroups.push(...group.exercise_template_ids);
        }
      }
    }

    const allExerciseTemplateIds = [
      ...new Set([...exerciseTemplateIds, ...exerciseTemplateIdsFromGroups]),
    ];

    const exerciseTemplatesDalResult = await queryWithSession(
      getExerciseTemplatesByIds,
      allExerciseTemplateIds,
    );
    const [exerciseTemplatesErr, exerciseTemplatesData] =
      exerciseTemplatesDalResult;
    const exerciseTemplatesResult = exerciseTemplatesErr
      ? { success: false as const, error: formatDalError(exerciseTemplatesErr) }
      : {
          success: true as const,
          data: new Map(Object.entries(exerciseTemplatesData)),
        };

    const exerciseNamesMap = new Map<string, string>();
    if (exerciseTemplatesResult.success) {
      for (const [templateId, template] of exerciseTemplatesResult.data) {
        if (template.exercise_name) {
          exerciseNamesMap.set(templateId, template.exercise_name);
        }
      }
    }

    return {
      success: true,
      data: {
        assignment,
        exerciseNamesMap,
        groupsMap,
      },
    };
  }

  public async getListPaginated(
    page: number = 1,
    pageSize: number = 25,
    search?: string,
    showAssigned: boolean = false,
  ): Promise<
    | SupabaseSuccess<{
        data: ProgramAssignmentWithTemplate[];
        page: number;
        pageSize: number;
        total: number;
        hasMore: boolean;
      }>
    | SupabaseError
  > {
    return toLegacyResult(
      await query(getProgramAssignmentListPaginated, {
        page,
        pageSize,
        search,
        showAssigned,
      }),
    );
  }

  public async assignToUser(
    templateAssignmentId: string,
    userId: string,
    startDate: string,
  ): Promise<SupabaseSuccess<ProgramAssignment> | SupabaseError> {
    return toLegacyResult(
      await mutate(assignProgramToUser, {
        templateAssignmentId,
        userId,
        startDate,
      }),
    );
  }

  public async deleteProgramRPC(
    programAssignmentId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    if (!programAssignmentId) {
      return {
        success: false,
        error: 'Program assignment ID is required',
      };
    }

    const client = await createClient();
    return voidFromDeleteResult(
      await mutate(
        deleteProgramRpc,
        { programAssignmentId },
        { client },
      ),
    );
  }

  public async updateDerivedAssignmentsSchedule(
    baseAssignmentId: string,
    workoutScheduleId: string,
    derivedStatus: typeof PROGRAM_ASSIGNMENT_STATUS.ACTIVE | typeof PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM = PROGRAM_ASSIGNMENT_STATUS.ACTIVE,
  ): Promise<SupabaseSuccess<number> | SupabaseError> {
    if (!baseAssignmentId || !workoutScheduleId) {
      return {
        success: false,
        error: 'Base assignment ID and workout schedule ID are required',
      };
    }

    const result = await mutate(updateDerivedProgramAssignmentSchedule, {
      baseAssignmentId,
      workoutScheduleId,
      derivedStatus,
    });
    const [err, data] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: data.count };
  }
}
