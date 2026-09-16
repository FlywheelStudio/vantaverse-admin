/** Avatar stack helpers for Save Template modal (HTML `mdUpdateDerived` parity). */

export const AFFECTED_STACK_VISIBLE = 5;

export const DEFAULT_TEMPLATE_NAME = 'Program';

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
