'use client';

import Image from 'next/image';

export function NotificationsButton() {
  return (
    <button
      className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] size-9 relative"
      aria-label="Notifications"
    >
      <Image
        className="hover:opacity-80"
        style={{ paddingTop: '2px' }}
        src="/message-icon.png"
        alt="Notifications"
        width={24}
        height={24}
      />
    </button>
  );
}
