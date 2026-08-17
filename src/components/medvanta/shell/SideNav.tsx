'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { hasUnreadMessagesForAdmin } from '@/app/(authenticated)/messages/actions';
import { useProfile } from '@/hooks/use-profile';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { Icon } from '../actions/Icon';
import { Avatar } from '../data-display/Avatar';
import { SHELL_NAV, isShellNavSection, type ShellNavId } from './nav';

export interface SideNavProps {
  active: ShellNavId;
}

function SideNavUser(): React.ReactElement {
  const { data: profileData, isLoading } = useProfile();
  const profile = profileData as ProfileWithStats | null | undefined;

  const displayName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email ||
    'User';

  const roleLabel = profile?.is_super_admin
    ? 'Super Admin'
    : profile?.role
      ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
      : 'Admin';

  return (
    <div className="side-user">
      <Avatar
        name={displayName}
        src={profile?.avatar_url ?? undefined}
        size="sm"
      />
      <div className="min-w-0">
        <div className="n">{isLoading ? 'Loading…' : displayName}</div>
        <div className="r">{roleLabel}</div>
      </div>
    </div>
  );
}

/** HTML `.side` navigation rail matching the MedVanta rebuild prototype. */
export function SideNav({ active }: SideNavProps): React.ReactElement {
  const router = useRouter();
  const { data: hasUnreadMessages = false } = useQuery({
    queryKey: ['messages', 'has-unread-sidebar'],
    queryFn: async () => {
      const result = await hasUnreadMessagesForAdmin();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: 60000,
    initialData: false,
  });

  return (
    <aside className="side">
      <div className="side-brand">
        <div className="side-mark" aria-hidden>
          <Icon name="Activity" size={18} />
        </div>
        <span className="side-pl">VantaThrive</span>
      </div>

      {SHELL_NAV.map((entry) => {
        if (isShellNavSection(entry)) {
          return (
            <div key={entry.section} className="side-sec">
              {entry.section}
            </div>
          );
        }

        const isActive = active === entry.id;
        const showBadge = Boolean(entry.badge && hasUnreadMessages);

        return (
          <button
            key={entry.id}
            type="button"
            className={`nav-i${isActive ? ' on' : ''}`}
            onClick={() => router.push(entry.href)}
          >
            <Icon name={entry.icon} size={18} />
            <span className="l">{entry.label}</span>
            {showBadge ? <span className="nav-b">•</span> : null}
          </button>
        );
      })}

      <div className="side-foot">
        <button type="button" className="nav-i" disabled title="Placeholder">
          <Icon name="Settings" size={18} />
          <span className="l">Settings</span>
        </button>
        <button type="button" className="nav-i" disabled title="Placeholder">
          <Icon name="CircleHelp" size={18} />
          <span className="l">Help & docs</span>
        </button>
        <SideNavUser />
      </div>
    </aside>
  );
}
