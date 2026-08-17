'use client';

import { ReactNode, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';
import BreadcrumbNavigator from './header/breadcrumb-navigator';

interface PageWrapperProps {
  subheader: ReactNode;
  children: ReactNode;
}

const HEADER_PADDING_LEFT = 16;

export function PageWrapper({ subheader, children }: PageWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);

  const [scrollPosition, setScrollPosition] = useState<number[]>([]);

  const handleScroll = useCallback(() => {
    const element = containerRef.current;
    if (!element) return;

    const currentScrollTop = element.scrollTop;
    const lastScrollTop = lastScrollTopRef.current;
    const direction =
      currentScrollTop > lastScrollTop ? 1 : currentScrollTop < lastScrollTop ? -1 : 0;

    lastScrollTopRef.current = currentScrollTop;
    setScrollPosition([direction, currentScrollTop]);
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true });
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
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--bg-app)]">
      <header
        suppressHydrationWarning
        className="content-title flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-card)] text-[var(--text-strong)]"
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
        className="slim-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--bg-app)] p-4"
        ref={containerRef}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <Suspense fallback={<div className="mb-4 h-12" />}>
          <BreadcrumbNavigator scrollPosition={scrollPosition} />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
