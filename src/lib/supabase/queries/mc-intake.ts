import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

const mcIntakeSurveySchema = z.object({
  occupation: z.string().nullable(),
  symptoms: z.array(z.string()),
  health_conditions: z.array(z.string()),
  activity_level: z.string().nullable(),
  commitment_days: z.number().nullable(),
  commitment_minutes: z.number().nullable(),
  preconditions: z.boolean().nullable(),
  preconditions_details: z.string().nullable(),
});

export type McIntakeSurvey = z.infer<typeof mcIntakeSurveySchema>;

const mcIntakeSurveyNullableSchema = mcIntakeSurveySchema.nullable();

export const mcIntakeKeys = {
  all: ['mc-intake'] as const,
  byUser: (userId: string) => [...mcIntakeKeys.all, 'user', userId] as const,
};

function collectOptionIds(survey: {
  symptoms: unknown;
  health_conditions: unknown;
}): number[] {
  const optionIds: number[] = [];

  if (Array.isArray(survey.symptoms) && survey.symptoms.length > 0) {
    const symptomIds = survey.symptoms
      .filter(
        (id: unknown): id is number =>
          id !== null && id !== undefined && typeof id === 'number',
      )
      .map((id: number) => Number(id));

    optionIds.push(...symptomIds);
  }

  if (
    Array.isArray(survey.health_conditions) &&
    survey.health_conditions.length > 0
  ) {
    const conditionIds = survey.health_conditions
      .filter(
        (id: unknown): id is number =>
          id !== null && id !== undefined && typeof id === 'number',
      )
      .map((id: number) => Number(id));

    optionIds.push(...conditionIds);
  }

  return [...new Set(optionIds)];
}

function resolveSymptomTitles(
  symptoms: unknown,
  optionsMap: Map<number, string>,
): string[] {
  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    return [];
  }

  const titles: string[] = [];
  for (const id of symptoms) {
    if (id !== null && id !== undefined) {
      const title = optionsMap.get(Number(id));
      if (title) {
        titles.push(title);
      }
    }
  }
  return titles;
}

async function fetchSurveyByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: McIntakeSurvey | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: surveys, error: surveyError } = await client
    .from('mc_intake_survey')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  const survey = surveys?.[0] ?? null;

  if (surveyError) {
    return { data: null, error: surveyError };
  }

  if (!survey) {
    return { data: null, error: null };
  }

  const uniqueOptionIds = collectOptionIds(survey);
  let optionsMap: Map<number, string> = new Map();

  if (uniqueOptionIds.length > 0) {
    const { data: options, error: optionsError } = await client
      .from('mc_intake_options')
      .select('id, title, subtitle, icon')
      .in('id', uniqueOptionIds);

    if (optionsError) {
      return { data: null, error: optionsError };
    }

    if (options && options.length > 0) {
      optionsMap = new Map(options.map((opt) => [Number(opt.id), opt.title]));
    }
  }

  const symptoms = resolveSymptomTitles(survey.symptoms, optionsMap);
  const health_conditions = resolveSymptomTitles(
    survey.health_conditions,
    optionsMap,
  );

  const activity_level =
    survey.activity_level !== null
      ? (optionsMap.get(survey.activity_level) ?? null)
      : null;

  const parsed = mcIntakeSurveySchema.safeParse({
    occupation: survey.occupation,
    symptoms,
    health_conditions,
    activity_level,
    commitment_days: survey.commitment_days,
    commitment_minutes: survey.commitment_minutes,
    preconditions: survey.preconditions,
    preconditions_details: survey.preconditions_details,
  });

  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** Latest MC Intake survey for a user with resolved option titles (service role). */
export const getSurveyByUserId = defineQuery({
  key: mcIntakeKeys.byUser,
  schema: mcIntakeSurveyNullableSchema,
  client: 'admin',
  execute: (client, userId: string) => fetchSurveyByUserId(client, userId),
});
