'use client';

import { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';
import BreadcrumbNavigator from './header/breadcrumb-navigator';

interface PageWrapperProps {
  subheader: ReactNode;
  topContent?: ReactNode | null;
  children: ReactNode;
}

const HEADER_PADDING_LEFT = 10;

export function PageWrapper({ subheader, topContent, children }: PageWrapperProps) {

  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);

  const [scrollPosition, setScrollPosition] = useState<number[]>([]);

  const handleScroll = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    const currentScrollTop = element.scrollTop;
    const lastScrollTop = lastScrollTopRef.current;
    const direction = currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : 0;
    
    lastScrollTopRef.current = currentScrollTop;
    setScrollPosition([direction, currentScrollTop]);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
      // Initialize scroll position
      lastScrollTopRef.current = element.scrollTop;
      handleScroll();
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <div className="h-full min-h-0 w-full flex flex-col">
      <header
        suppressHydrationWarning
        className="text-white flex items-center justify-between shrink-0 content-title"
        style={{
          paddingLeft: `${HEADER_PADDING_LEFT}px`,
          height: `${VANTABUDDY_CONFIG.height}px`,
        }}
        aria-label="Page Header"
      >
        {subheader}
      </header>
      <div
        suppressHydrationWarning
        className="p-4 flex flex-col flex-1 min-h-0 overflow-y-auto slim-scrollbar"
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
