type ShellNavId =
  | 'dashboard'
  | 'messages'
  | 'members'
  | 'groups'
  | 'programs'
  | 'exercises'
  | 'manage';

type ShellNavItem = {
  id: ShellNavId;
  icon: string;
  label: string;
  href: string;
  badge?: boolean;
};

type ShellNavSection = { section: string };

type ShellNavEntry = ShellNavSection | ShellNavItem;

export const SHELL_NAV: ShellNavEntry[] = [
  { section: 'Monitor' },
  { id: 'dashboard', icon: 'LayoutDashboard', label: 'Dashboard', href: '/' },
  { id: 'messages', icon: 'MessageSquare', label: 'Messages', href: '/messages', badge: true },
  { section: 'People' },
  { id: 'members', icon: 'UsersRound', label: 'Members', href: '/users' },
  { id: 'groups', icon: 'Building2', label: 'Groups', href: '/groups' },
  { section: 'Library' },
  { id: 'programs', icon: 'ClipboardList', label: 'Programs', href: '/builder' },
  { id: 'exercises', icon: 'Dumbbell', label: 'Exercises', href: '/exercises' },
];

/**
 * Maps the current pathname to the active shell nav id.
 *
 * `manage` lives in the sidebar footer rather than in `SHELL_NAV`, so it has no
 * entry above but still needs an active-state branch here.
 */
export function navIdFromPathname(pathname: string): ShellNavId {
  if (pathname.startsWith('/manage')) return 'manage';
  if (pathname.startsWith('/messages')) return 'messages';
  if (pathname.startsWith('/users')) return 'members';
  if (pathname.startsWith('/groups')) return 'groups';
  if (pathname.startsWith('/builder')) return 'programs';
  if (pathname.startsWith('/exercises')) return 'exercises';
  return 'dashboard';
}

export function isShellNavSection(entry: ShellNavEntry): entry is ShellNavSection {
  return 'section' in entry;
}
