'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { UserAvatar } from '../header/user-avatar';
import { hasUnreadMessagesForAdmin } from '@/app/(authenticated)/messages/actions';

const LOOK_DOWN_COOLDOWN_MS = 5000;

export function Sidebar() {
  const pathname = usePathname();
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

  const triggerLookRight = () => {
    window.dispatchEvent(new CustomEvent(VANTABUDDY_LOOK_RIGHT_EVENT));
  };

  const triggerLookDown = () => {
    const now = Date.now();
    if (now - lastLookDownAt.current >= LOOK_DOWN_COOLDOWN_MS) {
      lastLookDownAt.current = now;
      window.dispatchEvent(new CustomEvent(VANTABUDDY_LOOK_DOWN_EVENT));
    }
  };

  return (
    <aside
      className="fixed shadow-xl z-10 rounded-lg overflow-hidden"
      style={{
        top: vantabuddyY,
        left: vantabuddyX,
        width: SIDEBAR_CONFIG.width,
        height: `calc(100vh - ${HEADER_HEIGHT}px)`,
      }}
    >
      <div
        className="pr-6 pb-6 h-full flex flex-col overflow-y-auto slim-scrollbar"
        style={{
          paddingTop: `${VANTABUDDY_CONFIG.height}px`,
        }}
      >
        <nav className="space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            const showUnreadBadge = !!(
              link.supportsUnreadBadge && hasUnreadMessages
            );

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={triggerLookRight}
                onMouseEnter={triggerLookDown}
                className={`content-link flex items-center gap-3 px-4 rounded-r-lg py-3 transition-colors text-white ${
                  isActive ? 'bg-[#2454FF]/70' : 'hover:bg-[#2454FF]/40'
                }`}
              >
                <span className="relative inline-flex">
                  <Icon className="w-5 h-5" />
                  {showUnreadBadge && (
                    <span
                      className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500"
                      aria-label="Unread messages"
                    />
                  )}
                </span>
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 glass-background rounded-r-lg p-2 mt-auto">
          <UserAvatar showName={true} />
        </div>
      </div>
    </aside>
  );
}
