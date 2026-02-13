'use client';

import { VantaBuddyTrigger } from '@/components/sidebar/vantabuddy-trigger';
import { Sidebar } from '@/components/sidebar/sidebar';
import { SIDEBAR_CONFIG } from '@/lib/configs/sidebar';
import { ViewTransition } from 'react';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full relative">
      <VantaBuddyTrigger />
      <Sidebar />
      <ViewTransition name="main">
      <main
        className="flex flex-col min-h-0 h-screen overflow-hidden"
        style={{
          marginLeft: `${SIDEBAR_CONFIG.width}px`,
          width: `calc(100% - ${SIDEBAR_CONFIG.width}px)`,
        }}
      >
        {children}
      </main>
      </ViewTransition>
    </div>
  );
}
