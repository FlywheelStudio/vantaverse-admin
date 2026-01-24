'use client';

import { ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { useSidebar } from '@/context/sidebar';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';
import BreadcrumbNavigator from './header/breadcrumb-navigator';

interface PageWrapperProps {
  subheader: ReactNode;
  topContent?: ReactNode | null;
  children: ReactNode;
}

export function PageWrapper({ subheader, topContent, children }: PageWrapperProps) {
  const { isOpen, isExpanded } = useSidebar();

  const paddingLeft =
    isExpanded && isOpen ? 10 : isOpen ? 10 : VANTABUDDY_CONFIG.width + 10;

  const containerRef = useRef<HTMLDivElement>(null);

  const [scrollPosition, setScrollPosition] = useState<number[]>([]);

  const handleWheel = (event: WheelEvent) => {
    setScrollPosition([event.deltaY, containerRef.current?.scrollTop || 0]);
  };

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.addEventListener('wheel', handleWheel);
    }

    return () => {
      if (element) {
        element.removeEventListener('wheel', handleWheel);
      }
    };
  });

  return (
    <div className="min-h-[100dvh] w-full flex flex-col">
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
        className="p-4 flex-1 min-h-0 overflow-y-auto slim-scrollbar"
        ref={containerRef}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        {topContent === undefined || topContent === null ? (
          <Suspense fallback={<div className="h-12 mb-4" />}>
            <BreadcrumbNavigator scrollPosition={scrollPosition} />
          </Suspense>
        ) : (
          topContent
        )}
        {children}
      </div>
    </div>
  );
}
