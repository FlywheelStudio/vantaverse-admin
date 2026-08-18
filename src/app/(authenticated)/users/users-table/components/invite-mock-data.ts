export interface MockInvitee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin';
  groupId: string | null;
  groupName: string | null;
  onboarding: 'full' | 'screening' | 'consultation';
}

interface MockInviteGroup {
  id: string;
  name: string;
}

/** Mock groups for invite Group picker (no RPC). */
export const MOCK_INVITE_GROUPS: MockInviteGroup[] = [
  { id: 'grp-capital-msk', name: 'Capital MSK' },
  { id: 'grp-northline-ortho', name: 'Northline Ortho' },
  { id: 'grp-riverbend-spine', name: 'Riverbend Spine' },
  { id: 'grp-harbor-health', name: 'Harbor Health' },
];

export const KEEP_ROLE_VALUE = '__keep_role__';
export const KEEP_GROUP_VALUE = '__keep_group__';
export const KEEP_ONBOARDING_VALUE = '__keep_onboarding__';
export const CHOOSE_GROUP_VALUE = '';

export type InviteOnboarding = MockInvitee['onboarding'];
export type InviteRole = MockInvitee['role'];

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

/** Sample invitees matching HTML `INVITEES` for layout QA. */
export const SAMPLE_INVITEES: MockInvitee[] = [
  {
    id: 'sample-priya',
    email: 'priya.menon@capitalmsk.com',
    firstName: 'Priya',
    lastName: 'Menon',
    role: 'member',
    groupId: 'grp-capital-msk',
    groupName: 'Capital MSK',
    onboarding: 'full',
  },
  {
    id: 'sample-owen',
    email: 'owen.fairhurst@capitalmsk.com',
    firstName: 'Owen',
    lastName: 'Fairhurst',
    role: 'admin',
    groupId: 'grp-capital-msk',
    groupName: 'Capital MSK',
    onboarding: 'screening',
  },
  {
    id: 'sample-idowu',
    email: 'm.idowu@capitalmsk.com',
    firstName: '',
    lastName: '',
    role: 'member',
    groupId: null,
    groupName: null,
    onboarding: 'full',
  },
  {
    id: 'sample-hana',
    email: 'hana.wexler@northlineortho.com',
    firstName: 'Hana',
    lastName: 'Wexler',
    role: 'member',
    groupId: 'grp-northline-ortho',
    groupName: 'Northline Ortho',
    onboarding: 'full',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

/**
 * Build a mock invitee row from an email with default role / group / path.
 */
export function createInviteeFromEmail(
  email: string,
  overrides: Partial<MockInvitee> = {},
): MockInvitee {
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

/**
 * Resolve mock group name from id.
 */
export function getMockGroupName(groupId: string | null): string | null {
  if (!groupId) return null;
  return MOCK_INVITE_GROUPS.find((g) => g.id === groupId)?.name ?? null;
}
