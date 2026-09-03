import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
  formatDalError,
  mutate,
  query,
  type DalResult,
} from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/core/server';
import { calculateEndDate, formatDateForDB } from '@/lib/utils';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';

import type { SupabaseError, SupabaseSuccess } from '../query';
import {
  programAssignmentSchema,
  programAssignmentMemberSchema,
  programAssignmentWithTemplateSchema,
  type ProgramAssignment,
  type ProgramAssignmentMember,
  type ProgramAssignmentWithTemplate,
} from '../schemas/program-assignments';
import type { ProgramTemplate } from '../schemas/program-templates';
import { GroupsQuery } from './groups';
import { ExerciseTemplatesQuery } from './exercise-templates';
import { ProgramTemplatesQuery } from './program-templates';

export const MIN_GATES_FOR_PROGRAM_ASSIGNMENT = 5;

const ASSIGNMENT_WITH_TEMPLATE_SELECT = `
  *,
  program_template (*),
  workout_schedule:workout_schedules (*)
`;

const ASSIGNMENT_WITH_TEMPLATE_AND_PROFILES_SELECT = `
  *,
  program_template (*),
  workout_schedule:workout_schedules (*),
  profiles!program_assignment_user_id_fkey (id, first_name, last_name, email)
`;

const programAssignmentListSchema = programAssignmentWithTemplateSchema.array();
const programAssignmentNullableSchema =
  programAssignmentWithTemplateSchema.nullable();
const programAssignmentMemberListSchema =
  programAssignmentMemberSchema.array();
const programAssignmentRowNullableSchema = programAssignmentSchema.nullable();

const memberStatsEntrySchema = z.object({
  members: z.number(),
  avgCompletion: z.number().nullable(),
});
const memberStatsSchema = z.record(z.string(), memberStatsEntrySchema);

const templatesPaginatedSchema = z.object({
  data: programAssignmentListSchema,
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
  memberStats: memberStatsSchema,
});

const listPaginatedSchema = z.object({
  data: programAssignmentListSchema,
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

const workoutScheduleFieldsSchema = z.object({
  workout_schedule_id: z.string().nullable(),
  patient_override: z.unknown().nullable(),
});

const complianceSchema = z.number().nullable();
const deleteResultSchema = z.object({ id: z.string() });
const updateDerivedResultSchema = z.object({
  id: z.string(),
  count: z.number(),
});

const createProgramAssignmentInputSchema = z.object({
  programTemplateId: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  organizationId: z.string().nullable().optional(),
  workoutScheduleId: z.string().nullable().optional(),
});

const deleteProgramAssignmentInputSchema = z.object({
  id: z.string(),
});

const updateDatesByTemplateIdInputSchema = z.object({
  templateId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

const clearDatesByTemplateIdInputSchema = z.object({
  templateId: z.string(),
});

const updateDatesByIdsInputSchema = z.object({
  ids: z.array(z.string()),
  startDate: z.string(),
  endDate: z.string(),
});

const updateWorkoutScheduleIdInputSchema = z.object({
  assignmentId: z.string(),
  workoutScheduleId: z.string(),
});

const assignToUserInputSchema = z.object({
  templateAssignmentId: z.string(),
  userId: z.string(),
  startDate: z.string(),
});

const deleteProgramRpcInputSchema = z.object({
  programAssignmentId: z.string(),
});

const updateDerivedAssignmentsScheduleInputSchema = z.object({
  baseAssignmentId: z.string(),
  workoutScheduleId: z.string(),
  derivedStatus: z.enum([
    PROGRAM_ASSIGNMENT_STATUS.ACTIVE,
    PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM,
  ]),
});

export type GetTemplatesPaginatedInput = {
  page?: number;
  pageSize?: number;
  search?: string;
  weeks?: number;
  showAssigned?: boolean;
};

export type GetListPaginatedInput = {
  page?: number;
  pageSize?: number;
  search?: string;
  showAssigned?: boolean;
};

export type CreateProgramAssignmentInput = z.infer<
  typeof createProgramAssignmentInputSchema
>;

export const programAssignmentKeys = {
  all: ['program-assignments'] as const,
  templates: () => [...programAssignmentKeys.all, 'templates'] as const,
  templatesPaginated: (input: GetTemplatesPaginatedInput) =>
    [
      ...programAssignmentKeys.all,
      'templates-paginated',
      input.page ?? 1,
      input.pageSize ?? 16,
      input.search ?? '',
      input.weeks ?? null,
      input.showAssigned ?? false,
    ] as const,
  detail: (id: string) => [...programAssignmentKeys.all, 'detail', id] as const,
  preProgramTemplate: () =>
    [...programAssignmentKeys.all, 'pre-program-template'] as const,
  byTemplateId: (templateId: string) =>
    [...programAssignmentKeys.all, 'by-template', templateId] as const,
  membersByTemplateId: (templateId: string) =>
    [...programAssignmentKeys.all, 'members', templateId] as const,
  workoutScheduleFields: (id: string) =>
    [...programAssignmentKeys.all, 'workout-schedule-fields', id] as const,
  complianceByUserId: (userId: string) =>
    [...programAssignmentKeys.all, 'compliance', userId] as const,
  memberStats: (ids: string[]) =>
    [
      ...programAssignmentKeys.all,
      'member-stats',
      ...[...ids].sort(),
    ] as const,
  activeByUserId: (userId: string) =>
    [...programAssignmentKeys.all, 'active', userId] as const,
  listPaginated: (input: GetListPaginatedInput) =>
    [
      ...programAssignmentKeys.all,
      'list-paginated',
      input.page ?? 1,
      input.pageSize ?? 25,
      input.search ?? '',
      input.showAssigned ?? false,
    ] as const,
};

type ProfileJoin = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
};

type RawAssignmentWithTemplate = ProgramAssignmentWithTemplate & {
  profiles?: ProfileJoin | null;
  workout_schedule?: Database['public']['Tables']['workout_schedules']['Row'] | null;
};

function transformAssignmentRow(
  item: RawAssignmentWithTemplate,
  includeProfiles?: boolean,
): ProgramAssignmentWithTemplate {
  return {
    ...item,
    program_template: item.program_template || null,
    workout_schedule: item.workout_schedule || null,
    profiles: includeProfiles ? item.profiles ?? null : undefined,
  };
}

function emptyTemplatesPaginated(
  page: number,
  pageSize: number,
): z.infer<typeof templatesPaginatedSchema> {
  return {
    data: [],
    page,
    pageSize,
    total: 0,
    hasMore: false,
    memberStats: {},
  };
}

async function filterTemplateIdsByWeeks(
  client: SupabaseClient<Database>,
  weeks: number,
): Promise<{
  data: string[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: templates, error } = await client
    .from('program_template')
    .select('id')
    .eq('weeks', weeks);

  if (error) {
    return { data: null, error };
  }

  return { data: templates?.map((t) => t.id) ?? [], error: null };
}

async function filterTemplateIdsBySearch(
  client: SupabaseClient<Database>,
  search: string,
  existingTemplateIds?: string[],
): Promise<{
  data: string[] | null;
  error: { message: string; code?: string } | null;
}> {
  const searchLower = search.toLowerCase();
  const { data: searchTemplates, error } = await client
    .from('program_template')
    .select('id')
    .or(
      `name.ilike.%${searchLower}%,description.ilike.%${searchLower}%,goals.ilike.%${searchLower}%`,
    );

  if (error) {
    return { data: null, error };
  }

  const searchTemplateIds = searchTemplates?.map((t) => t.id) ?? [];
  const templateIds = existingTemplateIds
    ? existingTemplateIds.filter((id) => searchTemplateIds.includes(id))
    : searchTemplateIds;

  return { data: templateIds, error: null };
}

async function fetchMemberStatsByTemplateIds(
  client: SupabaseClient<Database>,
  templateIds: string[],
): Promise<{
  data: z.infer<typeof memberStatsSchema> | null;
  error: { message: string; code?: string } | null;
}> {
  const empty: z.infer<typeof memberStatsSchema> = {};
  if (templateIds.length === 0) {
    return { data: empty, error: null };
  }

  const { data, error } = await client.rpc('get_template_member_stats', {
    p_template_ids: templateIds,
  });

  if (error) {
    return { data: null, error };
  }

  const result: z.infer<typeof memberStatsSchema> = {};
  for (const id of templateIds) {
    result[id] = { members: 0, avgCompletion: null };
  }

  for (const raw of data ?? []) {
    const row = raw as {
      program_template_id: string;
      members: number;
      avg_completion: number | null;
    };
    result[row.program_template_id] = {
      members: Number(row.members),
      avgCompletion:
        row.avg_completion === null ? null : Number(row.avg_completion),
    };
  }

  return { data: result, error: null };
}

async function fetchTemplates(
  client: SupabaseClient<Database>,
): Promise<{
  data: ProgramAssignmentWithTemplate[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_assignment')
    .select(ASSIGNMENT_WITH_TEMPLATE_SELECT)
    .eq('status', 'template')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: [], error: null };
  }

  const transformed = data.map((item) =>
    transformAssignmentRow(item as RawAssignmentWithTemplate),
  );
  const parsed = programAssignmentListSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchTemplatesPaginated(
  client: SupabaseClient<Database>,
  input: GetTemplatesPaginatedInput,
): Promise<{
  data: z.infer<typeof templatesPaginatedSchema> | null;
  error: { message: string; code?: string } | null;
}> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 16;
  const showAssigned = input.showAssigned ?? false;

  let templateIds: string[] | undefined;
  if (input.weeks !== undefined && input.weeks !== null) {
    const weeksResult = await filterTemplateIdsByWeeks(client, input.weeks);
    if (weeksResult.error) {
      return { data: null, error: weeksResult.error };
    }
    templateIds = weeksResult.data ?? [];
    if (templateIds.length === 0) {
      return { data: emptyTemplatesPaginated(page, pageSize), error: null };
    }
  }

  if (input.search) {
    const searchResult = await filterTemplateIdsBySearch(
      client,
      input.search,
      templateIds,
    );
    if (searchResult.error) {
      return { data: null, error: searchResult.error };
    }
    templateIds = searchResult.data ?? [];
    if (templateIds.length === 0) {
      return { data: emptyTemplatesPaginated(page, pageSize), error: null };
    }
  }

  let request = client
    .from('program_assignment')
    .select(ASSIGNMENT_WITH_TEMPLATE_AND_PROFILES_SELECT, { count: 'exact' });

  if (showAssigned) {
    request = request.eq('status', 'active');
  } else {
    request = request.eq('status', 'template');
  }

  if (templateIds && templateIds.length > 0) {
    request = request.in('program_template_id', templateIds);
  }

  request = request.order('created_at', { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  request = request.range(from, to);

  const { data, error, count } = await request;

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: emptyTemplatesPaginated(page, pageSize), error: null };
  }

  const transformed = data.map((item) =>
    transformAssignmentRow(item as RawAssignmentWithTemplate, showAssigned),
  );
  const parsed = programAssignmentListSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  const total = templateIds
    ? parsed.data.length < pageSize
      ? from + parsed.data.length
      : count ?? 0
    : count ?? 0;
  const hasMore = from + parsed.data.length < total;

  const pageTemplateIds = Array.from(
    new Set(
      parsed.data
        .map((item) => item.program_template?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const memberStatsResult = await fetchMemberStatsByTemplateIds(
    client,
    pageTemplateIds,
  );

  return {
    data: {
      data: parsed.data,
      page,
      pageSize,
      total,
      hasMore,
      memberStats: memberStatsResult.data ?? {},
    },
    error: null,
  };
}

async function fetchById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{
  data: ProgramAssignmentWithTemplate | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_assignment')
    .select(ASSIGNMENT_WITH_TEMPLATE_AND_PROFILES_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: null,
      error: { message: 'Program assignment not found', code: 'P0404' },
    };
  }

  const parsed = programAssignmentWithTemplateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchPreProgramTemplate(
  client: SupabaseClient<Database>,
): Promise<{
  data: ProgramAssignmentWithTemplate | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_assignment')
    .select(ASSIGNMENT_WITH_TEMPLATE_SELECT)
    .eq('status', PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const transformed = transformAssignmentRow(data as RawAssignmentWithTemplate);
  const parsed = programAssignmentWithTemplateSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchByTemplateId(
  client: SupabaseClient<Database>,
  programTemplateId: string,
): Promise<{
  data: ProgramAssignment | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_assignment')
    .select('*')
    .eq('program_template_id', programTemplateId)
    .eq('status', 'template')
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const parsed = programAssignmentSchema.safeParse(data);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchMembersByTemplateId(
  client: SupabaseClient<Database>,
  programTemplateId: string,
): Promise<{
  data: ProgramAssignmentMember[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_assignment')
    .select(
      `id, user_id, start_date, end_date, status,
        profiles!program_assignment_user_id_fkey (id, first_name, last_name, email)`,
    )
    .eq('program_template_id', programTemplateId)
    .in('status', [
      PROGRAM_ASSIGNMENT_STATUS.ACTIVE,
      PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM,
    ])
    .not('user_id', 'is', null)
    .order('created_at');

  if (error) {
    return { data: null, error };
  }

  const parsed = programAssignmentMemberListSchema.safeParse(data ?? []);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchWorkoutScheduleFields(
  client: SupabaseClient<Database>,
  assignmentId: string,
): Promise<{
  data: z.infer<typeof workoutScheduleFieldsSchema> | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: assignment, error } = await client
    .from('program_assignment')
    .select('workout_schedule_id, patient_override')
    .eq('id', assignmentId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!assignment) {
    return {
      data: null,
      error: { message: 'Program assignment not found', code: 'P0404' },
    };
  }

  return {
    data: {
      workout_schedule_id: assignment.workout_schedule_id,
      patient_override: assignment.patient_override,
    },
    error: null,
  };
}

async function fetchComplianceByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: number | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_with_stats')
    .select('compliance, program_completion_percentage')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const row = data as {
    compliance?: number | null;
    program_completion_percentage?: number | null;
  };
  const value = row.compliance ?? row.program_completion_percentage ?? null;
  return { data: value, error: null };
}

async function fetchActiveAssignmentByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: ProgramAssignmentWithTemplate | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('program_assignment')
    .select(ASSIGNMENT_WITH_TEMPLATE_SELECT)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    if (
      error.code === 'PGRST116' ||
      error.message?.includes('Cannot coerce the result to a single JSON object')
    ) {
      return { data: null, error: null };
    }
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const transformed = transformAssignmentRow(data as RawAssignmentWithTemplate);
  const parsed = programAssignmentWithTemplateSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchListPaginated(
  client: SupabaseClient<Database>,
  input: GetListPaginatedInput,
): Promise<{
  data: z.infer<typeof listPaginatedSchema> | null;
  error: { message: string; code?: string } | null;
}> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 25;
  const showAssigned = input.showAssigned ?? false;

  let request = client
    .from('program_assignment')
    .select(ASSIGNMENT_WITH_TEMPLATE_AND_PROFILES_SELECT, { count: 'exact' });

  if (showAssigned) {
    request = request.in('status', ['template', 'active']);
  } else {
    request = request.eq('status', 'template');
  }

  request = request.order('created_at', { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  request = request.range(from, to);

  const { data, error, count } = await request;

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: { data: [], page, pageSize, total: 0, hasMore: false },
      error: null,
    };
  }

  let transformed = data.map((item) =>
    transformAssignmentRow(item as RawAssignmentWithTemplate, true),
  );

  if (input.search) {
    const searchLower = input.search.toLowerCase();
    transformed = transformed.filter((item) => {
      if (item.user_id?.toLowerCase().includes(searchLower)) {
        return true;
      }

      const profiles = item.profiles;
      if (profiles) {
        const firstName = profiles.first_name?.toLowerCase() ?? '';
        const lastName = profiles.last_name?.toLowerCase() ?? '';
        const fullName = `${firstName} ${lastName}`.trim();
        const email = profiles.email?.toLowerCase() ?? '';
        if (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          fullName.includes(searchLower) ||
          email.includes(searchLower)
        ) {
          return true;
        }
      }

      if (item.program_template?.name?.toLowerCase().includes(searchLower)) {
        return true;
      }

      return false;
    });
  }

  const parsed = programAssignmentListSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  const adjustedTotal = input.search ? parsed.data.length : count ?? 0;
  const hasMore = input.search
    ? false
    : from + parsed.data.length < adjustedTotal;

  return {
    data: {
      data: parsed.data,
      page,
      pageSize,
      total: adjustedTotal,
      hasMore,
    },
    error: null,
  };
}

/** Template program assignments with joined template and schedule. */
export const getProgramAssignmentTemplates = defineQuery({
  key: programAssignmentKeys.templates,
  schema: programAssignmentListSchema,
  execute: (client) => fetchTemplates(client),
});

/** Paginated template/assigned program assignments with filters. */
export const getProgramAssignmentTemplatesPaginated = defineQuery({
  key: (input: GetTemplatesPaginatedInput) =>
    programAssignmentKeys.templatesPaginated(input),
  schema: templatesPaginatedSchema,
  client: 'admin',
  execute: (client, input: GetTemplatesPaginatedInput) =>
    fetchTemplatesPaginated(client, input),
});

/** Program assignment by id with template, schedule, and profile. */
export const getProgramAssignmentById = defineQuery({
  key: programAssignmentKeys.detail,
  schema: programAssignmentWithTemplateSchema,
  client: 'admin',
  execute: (client, id: string) => fetchById(client, id),
});

/** Global pre-program template assignment (singleton). */
export const getPreProgramTemplateAssignment = defineQuery({
  key: programAssignmentKeys.preProgramTemplate,
  schema: programAssignmentNullableSchema,
  execute: (client) => fetchPreProgramTemplate(client),
});

/** Template-status assignment for a program template id. */
export const getProgramAssignmentByTemplateId = defineQuery({
  key: programAssignmentKeys.byTemplateId,
  schema: programAssignmentRowNullableSchema,
  execute: (client, programTemplateId: string) =>
    fetchByTemplateId(client, programTemplateId),
});

/** Live member assignments for a program template. */
export const getProgramAssignmentMembersByTemplateId = defineQuery({
  key: programAssignmentKeys.membersByTemplateId,
  schema: programAssignmentMemberListSchema,
  client: 'admin',
  execute: (client, programTemplateId: string) =>
    fetchMembersByTemplateId(client, programTemplateId),
});

/** Workout schedule id and patient override for an assignment. */
export const getProgramAssignmentWorkoutScheduleFields = defineQuery({
  key: programAssignmentKeys.workoutScheduleFields,
  schema: workoutScheduleFieldsSchema,
  execute: (client, assignmentId: string) =>
    fetchWorkoutScheduleFields(client, assignmentId),
});

/** Compliance percentage for a user from program_with_stats. */
export const getProgramAssignmentComplianceByUserId = defineQuery({
  key: programAssignmentKeys.complianceByUserId,
  schema: complianceSchema,
  execute: (client, userId: string) => fetchComplianceByUserId(client, userId),
});

/** Member counts and avg completion per template id. */
export const getProgramAssignmentMemberStatsByTemplateIds = defineQuery({
  key: (templateIds: string[]) => programAssignmentKeys.memberStats(templateIds),
  schema: memberStatsSchema,
  client: 'admin',
  execute: (client, templateIds: string[]) =>
    fetchMemberStatsByTemplateIds(client, templateIds),
});

/** Active program assignment for a user. */
export const getActiveProgramAssignmentByUserId = defineQuery({
  key: programAssignmentKeys.activeByUserId,
  schema: programAssignmentNullableSchema,
  client: 'admin',
  execute: (client, userId: string) => fetchActiveAssignmentByUserId(client, userId),
});

/** Paginated program assignments with optional search. */
export const getProgramAssignmentListPaginated = defineQuery({
  key: (input: GetListPaginatedInput) =>
    programAssignmentKeys.listPaginated(input),
  schema: listPaginatedSchema,
  client: 'admin',
  execute: (client, input: GetListPaginatedInput) =>
    fetchListPaginated(client, input),
});

/** Create a template-status program assignment. */
export const createProgramAssignment = defineMutation({
  inputSchema: createProgramAssignmentInputSchema,
  schema: programAssignmentSchema,
  execute: async (client, input) => {
    const { data, error } = await client
      .from('program_assignment')
      .insert({
        program_template_id: input.programTemplateId,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        status: 'template',
        user_id: null,
        organization_id: input.organizationId ?? null,
        workout_schedule_id: input.workoutScheduleId ?? null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Failed to create program assignment' },
      };
    }

    return { data, error: null };
  },
  targets: () => [programAssignmentKeys.all],
});

/** Delete a program assignment (blocks pre-program template). */
export const deleteProgramAssignment = defineMutation({
  inputSchema: deleteProgramAssignmentInputSchema,
  schema: deleteResultSchema,
  execute: async (client, input) => {
    const { data: existing, error: fetchError } = await client
      .from('program_assignment')
      .select('status')
      .eq('id', input.id)
      .maybeSingle();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (existing?.status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE) {
      return {
        data: null,
        error: { message: 'Cannot delete the Pre-Program template' },
      };
    }

    const { error } = await client
      .from('program_assignment')
      .delete()
      .eq('id', input.id);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.id }, error: null };
  },
  targets: (input) => [
    programAssignmentKeys.all,
    programAssignmentKeys.detail(input.id),
  ],
});

/** Update dates on template assignments for a program template. */
export const updateProgramAssignmentDatesByTemplateId = defineMutation({
  inputSchema: updateDatesByTemplateIdInputSchema,
  schema: deleteResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { data: assignments, error: fetchError } = await client
      .from('program_assignment')
      .select('id')
      .eq('program_template_id', input.templateId)
      .eq('status', 'template');

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!assignments || assignments.length === 0) {
      return { data: { id: input.templateId }, error: null };
    }

    for (const assignment of assignments) {
      const { error } = await client
        .from('program_assignment')
        .update({
          start_date: input.startDate,
          end_date: input.endDate,
        })
        .eq('id', assignment.id);

      if (error) {
        return { data: null, error };
      }
    }

    return { data: { id: input.templateId }, error: null };
  },
  targets: () => [programAssignmentKeys.all],
});

/** Clear dates on template assignments for a program template. */
export const clearProgramAssignmentDatesByTemplateId = defineMutation({
  inputSchema: clearDatesByTemplateIdInputSchema,
  schema: deleteResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { data: assignments, error: fetchError } = await client
      .from('program_assignment')
      .select('id')
      .eq('program_template_id', input.templateId)
      .eq('status', 'template');

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    if (!assignments || assignments.length === 0) {
      return { data: { id: input.templateId }, error: null };
    }

    for (const assignment of assignments) {
      const { error } = await client
        .from('program_assignment')
        .update({ start_date: null, end_date: null })
        .eq('id', assignment.id);

      if (error) {
        return { data: null, error };
      }
    }

    return { data: { id: input.templateId }, error: null };
  },
  targets: () => [programAssignmentKeys.all],
});

/** Batch-update start/end dates for specific assignments. */
export const updateProgramAssignmentDatesByIds = defineMutation({
  inputSchema: updateDatesByIdsInputSchema,
  schema: deleteResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    if (input.ids.length === 0) {
      return { data: { id: 'none' }, error: null };
    }

    const { error } = await client
      .from('program_assignment')
      .update({ start_date: input.startDate, end_date: input.endDate })
      .in('id', input.ids);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.ids[0] }, error: null };
  },
  targets: () => [programAssignmentKeys.all],
});

/** Update workout schedule id on an assignment. */
export const updateProgramAssignmentWorkoutScheduleId = defineMutation({
  inputSchema: updateWorkoutScheduleIdInputSchema,
  schema: deleteResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { error } = await client
      .from('program_assignment')
      .update({ workout_schedule_id: input.workoutScheduleId })
      .eq('id', input.assignmentId);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.assignmentId }, error: null };
  },
  targets: (input) => [
    programAssignmentKeys.all,
    programAssignmentKeys.detail(input.assignmentId),
  ],
});

/** Assign a program template to a user (creates active assignment). */
export const assignProgramToUser = defineMutation({
  inputSchema: assignToUserInputSchema,
  schema: programAssignmentSchema,
  client: 'admin',
  execute: async (client, input) => {
    const sourceResult = await fetchById(client, input.templateAssignmentId);
    if (sourceResult.error) {
      return { data: null, error: sourceResult.error };
    }
    if (!sourceResult.data) {
      return {
        data: null,
        error: { message: 'Program assignment not found', code: 'P0404' },
      };
    }

    const templateAssignment = sourceResult.data;

    const { data: orgMember, error: orgError } = await client
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', input.userId)
      .eq('role', 'patient')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (orgError) {
      return { data: null, error: orgError };
    }

    if (!orgMember?.organization_id) {
      return {
        data: null,
        error: {
          message: 'User does not belong to any organization with patient role',
        },
      };
    }

    const { data: profileStats, error: statsError } = await client
      .from('profiles_with_stats')
      .select('max_gate_unlocked')
      .eq('id', input.userId)
      .maybeSingle();

    if (statsError) {
      return { data: null, error: statsError };
    }

    const maxGate = profileStats?.max_gate_unlocked ?? null;
    if (maxGate === null || maxGate < MIN_GATES_FOR_PROGRAM_ASSIGNMENT) {
      return {
        data: null,
        error: {
          message:
            'User must complete all 5 gates before a program can be assigned.',
        },
      };
    }

    const { data: existingAssignment } = await client
      .from('program_assignment')
      .select('id')
      .eq('user_id', input.userId)
      .eq('program_template_id', templateAssignment.program_template_id)
      .eq('status', 'active')
      .maybeSingle();

    if (existingAssignment) {
      return {
        data: null,
        error: {
          message: 'User already has an active assignment for this program',
        },
      };
    }

    const templateWeeks = templateAssignment.program_template?.weeks ?? 0;
    const startDateObj = new Date(input.startDate);
    const calculatedEnd =
      templateWeeks >= 1
        ? calculateEndDate(startDateObj, templateWeeks)
        : undefined;
    const endDate = formatDateForDB(calculatedEnd ?? startDateObj);

    const { data, error } = await client
      .from('program_assignment')
      .insert({
        program_template_id: templateAssignment.program_template_id,
        user_id: input.userId,
        organization_id: orgMember.organization_id,
        workout_schedule_id: templateAssignment.workout_schedule_id,
        start_date: input.startDate,
        end_date: endDate,
        status: 'active',
        completion: null,
        patient_override: null,
        base: templateAssignment.id,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Failed to create program assignment' },
      };
    }

    return { data, error: null };
  },
  targets: () => [programAssignmentKeys.all],
});

/** Delete a program via delete_program RPC. */
export const deleteProgramRpc = defineMutation({
  inputSchema: deleteProgramRpcInputSchema,
  schema: deleteResultSchema,
  execute: async (client, input) => {
    const { error } = await client.rpc('delete_program', {
      p_program_assignment_id: input.programAssignmentId,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.programAssignmentId }, error: null };
  },
  targets: (input) => [
    programAssignmentKeys.all,
    programAssignmentKeys.detail(input.programAssignmentId),
  ],
});

/** Update workout schedule on derived assignments from a base template. */
export const updateDerivedProgramAssignmentSchedule = defineMutation({
  inputSchema: updateDerivedAssignmentsScheduleInputSchema,
  schema: updateDerivedResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { count: matchCount, error: countError } = await client
      .from('program_assignment')
      .select('*', { count: 'exact', head: true })
      .eq('base', input.baseAssignmentId)
      .eq('status', input.derivedStatus);

    if (countError) {
      return { data: null, error: countError };
    }

    if (matchCount === 0) {
      return {
        data: { id: input.baseAssignmentId, count: 0 },
        error: null,
      };
    }

    const { error } = await client
      .from('program_assignment')
      .update({ workout_schedule_id: input.workoutScheduleId })
      .eq('base', input.baseAssignmentId)
      .eq('status', input.derivedStatus);

    if (error) {
      return { data: null, error };
    }

    return {
      data: { id: input.baseAssignmentId, count: matchCount ?? 0 },
      error: null,
    };
  },
  targets: () => [programAssignmentKeys.all],
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

function voidFromDeleteResult(
  result: DalResult<{ id: string }>,
): SupabaseSuccess<void> | SupabaseError {
  const mapped = toLegacyResult(result);
  if (!mapped.success) {
    return mapped;
  }
  return { success: true, data: undefined };
}

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
    const templateQuery = new ProgramTemplatesQuery();

    const templateResult = await templateQuery.create(
      `${template.name} (clone)`,
      template.weeks,
      template.description ?? null,
      template.goals ?? null,
      template.notes ?? null,
      source.organization_id ?? template.organization_id ?? null,
      template.image_url != null ? String(template.image_url) : null,
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

    const groupsQuery = new GroupsQuery();
    const groupsResult = await groupsQuery.getByIds(groupIds);

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

    const exerciseTemplatesQuery = new ExerciseTemplatesQuery();
    const exerciseTemplatesResult = await exerciseTemplatesQuery.getByIds(
      allExerciseTemplateIds,
    );

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
