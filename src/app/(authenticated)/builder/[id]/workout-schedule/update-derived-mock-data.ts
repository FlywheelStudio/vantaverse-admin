/** Mock impact counts for Save Template modal (HTML `mdUpdateDerived` parity). */

export interface UpdateDerivedImpactCounts {
  activePrograms: number;
  members: number;
  groups: number;
  /** Mid-week members called out in rebuild option copy (HTML). */
  midWeekMembers: number;
}

export const UPDATE_DERIVED_IMPACT_COUNTS: UpdateDerivedImpactCounts = {
  activePrograms: 14,
  members: 28,
  groups: 3,
  midWeekMembers: 3,
};

export const DEFAULT_TEMPLATE_NAME = 'Lower Body & Back Mobility';

export const AFFECTED_MEMBER_NAMES = [
  'Nadia Okonjo',
  'Chuck Bolland',
  'Ivan Marek',
  'Sonia Kaur',
  'Bruno Santos',
  'Temi Adeyemi',
] as const;

export const AFFECTED_STACK_VISIBLE = 5;

/**
 * Initials for MedVanta `.av` stack (first + last initial).
 */
export function getStackInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Deterministic tone class `av-t1`…`av-t4` from a name seed (HTML `tone`).
 */
export function getAvatarToneClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffff;
  }
  return `av-t${1 + (hash % 4)}`;
}
