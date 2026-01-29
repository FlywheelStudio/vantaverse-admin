import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  VANTABUDDY_CONFIG,
  SIDEBAR_CONFIG,
  HEADER_HEIGHT,
  NAV_LINKS,
} from '@/lib/configs/sidebar';
import { UserAvatar } from '../header/user-avatar';

export function Sidebar() {
  const pathname = usePathname();
  const vantabuddyX = VANTABUDDY_CONFIG.left;
  const vantabuddyY = VANTABUDDY_CONFIG.top;

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

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`content-link flex items-center gap-3 px-4 rounded-r-lg py-3 transition-colors text-white ${
                  isActive ? 'bg-[#2454FF]/70' : 'hover:bg-[#2454FF]/40'
                }`}
              >
                <Icon className="w-5 h-5" />
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
