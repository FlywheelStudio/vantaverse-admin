/** Minimum gates unlocked before a program can be assigned to a user. */
export const MIN_GATES_FOR_PROGRAM_ASSIGNMENT = 5;

export const PROGRAM_ASSIGNMENT_STATUS = {
  TEMPLATE: 'template',
  PRE_PROGRAM_TEMPLATE: 'pre_program_template',
  PRE_PROGRAM: 'pre_program',
  ACTIVE: 'active',
} as const;

export function isPreProgramTemplateStatus(
  status: string | null | undefined,
): boolean {
  return status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE;
}
