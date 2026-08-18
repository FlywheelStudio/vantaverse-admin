/** Mock defaults for Change Onboarding modal (HTML `mdChangeOnboarding` parity). */

export const ONBOARDING_GATE_COUNT = 4;

/** 0-based current gate; default 2 → badge "Gate 3 of 4". */
export const DEFAULT_ONBOARDING_GATE_INDEX = 2;

/** Cleared-gate labels used in the personalized alert (HTML order). */
export const ONBOARDING_CLEARED_GATE_LABELS = [
  'intake',
  'screening',
  'consultation',
] as const;

/**
 * Build "Gate N of 4" badge label from a 0-based gate index.
 */
export function formatGateBadge(gateIndex: number): string {
  const clamped = Math.max(
    0,
    Math.min(ONBOARDING_GATE_COUNT - 1, Math.floor(gateIndex)),
  );
  return `Gate ${clamped + 1} of ${ONBOARDING_GATE_COUNT}`;
}

/**
 * Personalized alert title: "{Name} has already cleared …".
 * Uses first `gateIndex + 1` labels (HTML Gate 3 → intake, screening, consultation).
 */
export function formatClearedGatesAlertTitle(
  firstName: string,
  gateIndex: number,
): string {
  const name = firstName.trim() || 'This member';
  const count = Math.max(
    1,
    Math.min(ONBOARDING_CLEARED_GATE_LABELS.length, Math.floor(gateIndex) + 1),
  );
  const labels = ONBOARDING_CLEARED_GATE_LABELS.slice(0, count).map((label) =>
    label === 'consultation' ? 'their consultation' : label,
  );

  if (labels.length === 1) {
    return `${name} has already cleared ${labels[0]}`;
  }

  const head = labels.slice(0, -1).join(', ');
  const last = labels[labels.length - 1];
  return `${name} has already cleared ${head} and ${last}`;
}
