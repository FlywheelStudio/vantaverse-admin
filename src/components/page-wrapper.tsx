import { ReactNode } from 'react';
import { useSidebar } from '@/context/sidebar';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';

interface PageWrapperProps {
  subheader: ReactNode;
  children: ReactNode;
}

export function PageWrapper({ subheader, children }: PageWrapperProps) {
  const { isOpen, isExpanded } = useSidebar();

  const paddingLeft =
    isExpanded && isOpen ? 10 : isOpen ? 10 : VANTABUDDY_CONFIG.width + 10;

  return (
    <div className="h-full w-full flex flex-col">
      <header
        suppressHydrationWarning
        className="text-white flex items-center justify-between shrink-0 content-title"
        style={{
          paddingLeft: `${paddingLeft}px`,
          height: `${VANTABUDDY_CONFIG.height}px`,
        }}
        aria-label="Page Header"
      >
        {subheader}
      </header>
      <div
        suppressHydrationWarning
        className="p-4 flex-1 overflow-y-auto h-full slim-scrollbar"
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {children}
      </div>
    </div>
  );
}
