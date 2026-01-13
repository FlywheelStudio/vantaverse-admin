import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';

export type McIntakeSurvey = {
  occupation: string | null;
  symptoms: string[];
  health_conditions: string[];
  activity_level: string | null;
  commitment_days: number | null;
  commitment_minutes: number | null;
  preconditions: boolean | null;
  preconditions_details: string | null;
};

export class McIntakeQuery extends SupabaseQuery {
  /**
   * Get MC Intake survey by user ID with resolved option titles
   * @param userId - The user ID to fetch survey for
   * @returns Success with survey data (with resolved option titles) or error
   */
  public async getSurveyByUserId(
    userId: string,
  ): Promise<SupabaseSuccess<McIntakeSurvey | null> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    // First, get the survey
    const { data: survey, error: surveyError } = await supabase
      .from('mc_intake_survey')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (surveyError) {
      return this.parseResponsePostgresError(
        surveyError,
        'Failed to get MC Intake survey',
      );
    }

    if (!survey) {
      return {
        success: true,
        data: null,
      };
    }

    // Collect all option IDs we need to resolve
    const optionIds: number[] = [];

    // Handle symptoms - ensure it's an array and not null
    if (Array.isArray(survey.symptoms) && survey.symptoms.length > 0) {
      // Filter out any null/undefined values and ensure they're numbers
      const symptomIds = survey.symptoms
        .filter(
          (id: unknown): id is number =>
            id !== null && id !== undefined && typeof id === 'number',
        )
        .map((id: number) => Number(id));

      optionIds.push(...symptomIds);
    }

    // Handle health conditions - ensure it's an array and not null
    if (
      Array.isArray(survey.health_conditions) &&
      survey.health_conditions.length > 0
    ) {
      // Filter out any null/undefined values and ensure they're numbers
      const conditionIds = survey.health_conditions
        .filter(
          (id: unknown): id is number =>
            id !== null && id !== undefined && typeof id === 'number',
        )
        .map((id: number) => Number(id));
      optionIds.push(...conditionIds);
    }

    // Remove duplicates
    const uniqueOptionIds = [...new Set(optionIds)];

    // Fetch all options in one query
    let optionsMap: Map<number, string> = new Map();

    if (uniqueOptionIds.length > 0) {
      const { data: options, error: optionsError } = await supabase
        .from('mc_intake_options')
        .select('id, title, subtitle, icon')
        .in('id', uniqueOptionIds);

      if (optionsError) {
        return this.parseResponsePostgresError(
          optionsError,
          'Failed to get MC Intake options',
        );
      }

      if (options && options.length > 0) {
        optionsMap = new Map(options.map((opt) => [Number(opt.id), opt.title]));
      }
    }

    // Resolve symptoms - preserve order and handle all IDs
    const symptoms: string[] = [];
    if (Array.isArray(survey.symptoms) && survey.symptoms.length > 0) {
      for (const id of survey.symptoms) {
        if (id !== null && id !== undefined) {
          const numId = Number(id);
          const title = optionsMap.get(numId);
          if (title) {
            symptoms.push(title);
          }
        }
      }
    }

    // Resolve health conditions - preserve order and handle all IDs
    const health_conditions: string[] = [];
    if (
      Array.isArray(survey.health_conditions) &&
      survey.health_conditions.length > 0
    ) {
      for (const id of survey.health_conditions) {
        if (id !== null && id !== undefined) {
          const numId = Number(id);
          const title = optionsMap.get(numId);
          if (title) {
            health_conditions.push(title);
          }
        }
      }
    }

    // Resolve activity level
    const activity_level =
      survey.activity_level !== null
        ? (optionsMap.get(survey.activity_level) ?? null)
        : null;

    return {
      success: true,
      data: {
        occupation: survey.occupation,
        symptoms,
        health_conditions,
        activity_level,
        commitment_days: survey.commitment_days,
        commitment_minutes: survey.commitment_minutes,
        preconditions: survey.preconditions,
        preconditions_details: survey.preconditions_details,
      },
    };
  }
}
