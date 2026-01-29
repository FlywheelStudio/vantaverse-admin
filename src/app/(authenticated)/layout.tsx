'use client';

import { VantaBuddyTrigger } from '@/components/sidebar/vantabuddy-trigger';
import { Sidebar } from '@/components/sidebar/sidebar';
import { SIDEBAR_CONFIG } from '@/lib/configs/sidebar';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full bg-linear-to-b from-[#0D47A1] via-[#2196F3] to-[#B3E5FC] relative"
      style={{
        background:
          'linear-gradient(180deg, #0D47A1 0%, #2196F3 50%, #B3E5FC 100%)',
      }}
    >
      <VantaBuddyTrigger />
      <Sidebar />
      <main
        className="flex flex-col min-h-0 h-screen overflow-hidden"
        style={{
          marginLeft: `${SIDEBAR_CONFIG.width}px`,
          width: `calc(100% - ${SIDEBAR_CONFIG.width}px)`,
        }}
      >
        {children}
      </main>
    </div>
  );
}
