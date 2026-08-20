'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { hasUnreadMessagesForAdmin } from '@/app/(authenticated)/messages/actions';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '../actions/Icon';
import { Avatar } from '../data-display/Avatar';
import { SHELL_NAV, isShellNavSection, type ShellNavId } from './nav';

interface SideNavProps {
  active: ShellNavId;
}

function SideNavUser(): React.ReactElement {
  const router = useRouter();
  const { signOut } = useAuth();
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

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch {
      toast.error('Could not sign out. Please try again.');
      return;
    }
    router.replace('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="side-user" aria-label="Account menu">
          <Avatar
            name={displayName}
            src={profile?.avatar_url ?? undefined}
            size="sm"
          />
          <div className="min-w-0">
            <div className="n">{isLoading ? 'Loading…' : displayName}</div>
            <div className="r">{roleLabel}</div>
          </div>
        </button>
      </DropdownMenuTrigger>
      {/* `side="top"`: the trigger sits at the bottom of the rail. */}
      <DropdownMenuContent side="top" align="start" className="min-w-[200px]">
        <DropdownMenuItem
          disabled={!profile?.id}
          onSelect={() => {
            if (profile?.id) router.push(`/users/${profile.id}`);
          }}
        >
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <div>
          <Image
            src="/medvanta-text.png"
            alt="MedVanta"
            width={140}
            height={42}
            className="h-auto w-auto max-w-[140px] object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
            priority
          />
          <span className="side-pl">VantaThrive admin</span>
        </div>
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
        <button
          type="button"
          className={`nav-i${active === 'manage' ? ' on' : ''}`}
          onClick={() => router.push('/manage')}
        >
          <Icon name="Settings" size={18} />
          <span className="l">Manage</span>
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
