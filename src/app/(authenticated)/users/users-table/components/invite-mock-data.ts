export interface Invitee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin';
  groupId: string | null;
  groupName: string | null;
  onboarding: 'full' | 'screening' | 'consultation';
}

export const KEEP_ROLE_VALUE = '__keep_role__';
export const KEEP_GROUP_VALUE = '__keep_group__';
export const KEEP_ONBOARDING_VALUE = '__keep_onboarding__';
export const CHOOSE_GROUP_VALUE = '';

export type InviteOnboarding = Invitee['onboarding'];
export type InviteRole = Invitee['role'];

export const INVITE_ROLE_OPTIONS: Array<{ value: InviteRole; label: string }> = [
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
];

export const INVITE_ONBOARDING_OPTIONS: Array<{
  value: InviteOnboarding;
  label: string;
}> = [
  { value: 'full', label: 'Full onboarding' },
  { value: 'screening', label: 'Skip screening' },
  { value: 'consultation', label: 'Skip screening + consultation' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/**
 * Build an invitee row from an email with default role / group / path.
 */
export function createInviteeFromEmail(
  email: string,
  overrides: Partial<Invitee> = {},
): Invitee {
  const normalized = email.trim().toLowerCase();
  return {
    id: `invite-${normalized}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    firstName: '',
    lastName: '',
    role: 'member',
    groupId: null,
    groupName: null,
    onboarding: 'full',
    ...overrides,
    email: (overrides.email ?? normalized).trim().toLowerCase(),
  };
}

/**
 * Parse paste text (newlines and/or commas) into unique email addresses.
 */
export function parseInviteEmails(text: string): string[] {
  const parts = text
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const emails: string[] = [];

  for (const part of parts) {
    const candidate = part.replace(/^<|>$/g, '').trim().toLowerCase();
    if (!EMAIL_RE.test(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);
    emails.push(candidate);
  }

  return emails;
}
