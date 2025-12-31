'use client';

import { SidebarProvider } from '@/context/sidebar';
import { VantaBuddyTrigger } from '@/components/sidebar/vantabuddy-trigger';
import { Sidebar } from '@/components/sidebar/sidebar';
import Header from './header';
import { useSidebar } from '@/context/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SIDEBAR_CONFIG,
  HEADER_HEIGHT,
  VANTABUDDY_CONFIG,
} from '@/lib/configs/sidebar';

function AuthenticatedContent({ children }: { children: React.ReactNode }) {
  const { isOpen, isExpanded } = useSidebar();
  const isMobile = useIsMobile();

  const sidebarOffset = isMobile
    ? VANTABUDDY_CONFIG.width
    : isExpanded
      ? SIDEBAR_CONFIG.width
      : VANTABUDDY_CONFIG.width;

  return (
    <div
      className="min-h-screen w-full bg-linear-to-b from-[#0D47A1] via-[#2196F3] to-[#B3E5FC] relative"
      style={{
        background:
          'linear-gradient(180deg, #0D47A1 0%, #2196F3 50%, #B3E5FC 100%)',
      }}
    >
      <Header />
      <VantaBuddyTrigger />
      {isMobile ? (
        <div className="flex">
          {isOpen && <Sidebar />}
          <main
            className="flex-1"
            style={{
              minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
              width: isOpen
                ? `calc(100% - ${VANTABUDDY_CONFIG.width}px)`
                : '100%',
              transition: `margin-left ${SIDEBAR_CONFIG.animation.duration}s cubic-bezier(${SIDEBAR_CONFIG.animation.ease.join(', ')})`,
            }}
          >
            {children}
          </main>
        </div>
      ) : (
        <>
          <Sidebar />
          <main
            style={{
              marginLeft: isOpen ? `${sidebarOffset}px` : '0',
              minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
              width: isOpen ? `calc(100% - ${sidebarOffset}px)` : '100%',
              transition: `margin-left ${SIDEBAR_CONFIG.animation.duration}s cubic-bezier(${SIDEBAR_CONFIG.animation.ease.join(', ')}), width ${SIDEBAR_CONFIG.animation.duration}s cubic-bezier(${SIDEBAR_CONFIG.animation.ease.join(', ')})`,
            }}
          >
            {children}
          </main>
        </>
      )}
    </div>
  );
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AuthenticatedContent>{children}</AuthenticatedContent>
    </SidebarProvider>
  );
}
