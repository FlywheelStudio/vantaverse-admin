/**
 * Admin "Onboarding path" is 4 steps. DB `user_max_gate` is a 0–8 ladder:
 * 0 none, 1 intake, 2 awaiting_screening, 3 screening, 4 awaiting_consultation,
 * 5 consultation, 6 program_assignment, 7 awaiting_program, 8 program_started.
 */

export const ONBOARDING_PATH_TOTAL = 4;

interface OnboardingPathInput {
  max_gate_unlocked?: number | null;
  intro_completed?: boolean | null;
  screening_completed?: boolean | null;
  consultation_completed?: boolean | null;
  program_assigned?: boolean | null;
  program_assignment_id?: string | null;
}

export interface OnboardingPathProgress {
  intakeDone: boolean;
  screeningDone: boolean;
  consultationDone: boolean;
  programDone: boolean;
  cleared: number;
  total: typeof ONBOARDING_PATH_TOTAL;
}

/**
 * Same 4-step progress for the members table and member detail.
 * ORs profile flags with the derived gate so skipped/awaiting stages stay aligned.
 */
export function getOnboardingPathProgress(
  user: OnboardingPathInput,
): OnboardingPathProgress {
  const gate = user.max_gate_unlocked ?? 0;
  const intakeDone = Boolean(user.intro_completed) || gate >= 1;
  const screeningDone = Boolean(user.screening_completed) || gate >= 3;
  const consultationDone = Boolean(user.consultation_completed) || gate >= 5;
  const programDone =
    Boolean(user.program_assigned || user.program_assignment_id) || gate >= 6;
  const cleared = [
    intakeDone,
    screeningDone,
    consultationDone,
    programDone,
  ].filter(Boolean).length;

  return {
    intakeDone,
    screeningDone,
    consultationDone,
    programDone,
    cleared,
    total: ONBOARDING_PATH_TOTAL,
  };
}
