'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  VANTABUDDY_CONFIG,
  SIDEBAR_CONFIG,
  HEADER_HEIGHT,
  NAV_LINKS,
} from '@/lib/configs/sidebar';
import {
  VANTABUDDY_LOOK_RIGHT_EVENT,
  VANTABUDDY_LOOK_DOWN_EVENT,
} from './vantabuddy-trigger';
import { SidebarNavItem } from '@/components/medvanta';
import { UserAvatar } from '../header/user-avatar';
import { hasUnreadMessagesForAdmin } from '@/app/(authenticated)/messages/actions';

const LOOK_DOWN_COOLDOWN_MS = 5000;

const NAV_ICON_NAMES: Record<string, string> = {
  '/': 'LayoutDashboard',
  '/groups': 'Building2',
  '/users': 'Users',
  '/builder': 'Dumbbell',
  '/messages': 'MessageSquare',
  '/exercises': 'Activity',
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const vantabuddyX = VANTABUDDY_CONFIG.left;
  const vantabuddyY = VANTABUDDY_CONFIG.top;
  const lastLookDownAt = useRef<number>(0);
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

  const triggerLookRight = (): void => {
    window.dispatchEvent(new CustomEvent(VANTABUDDY_LOOK_RIGHT_EVENT));
  };

  const triggerLookDown = (): void => {
    const now = Date.now();
    if (now - lastLookDownAt.current >= LOOK_DOWN_COOLDOWN_MS) {
      lastLookDownAt.current = now;
      window.dispatchEvent(new CustomEvent(VANTABUDDY_LOOK_DOWN_EVENT));
    }
  };

  return (
    <aside
      className="fixed z-10 overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--surface-card)] shadow-[var(--shadow-sm)]"
      style={{
        top: vantabuddyY,
        left: vantabuddyX,
        width: SIDEBAR_CONFIG.width,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      }}
    >
      <div
        className="flex h-full flex-col overflow-y-auto slim-scrollbar pb-6 pr-3"
        style={{
          paddingTop: `${VANTABUDDY_CONFIG.height}px`,
        }}
      >
        <nav className="flex flex-col gap-1 px-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const showUnreadBadge = !!(
              link.supportsUnreadBadge && hasUnreadMessages
            );

            return (
              <div key={link.href} onMouseEnter={triggerLookDown}>
                <SidebarNavItem
                  icon={NAV_ICON_NAMES[link.href] ?? 'Circle'}
                  label={link.label}
                  active={isActive}
                  badge={showUnreadBadge}
                  onClick={() => {
                    triggerLookRight();
                    router.push(link.href);
                  }}
                />
              </div>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-[var(--border-subtle)] px-2 pt-3">
          <UserAvatar showName={true} />
        </div>
      </div>
    </aside>
  );
}
