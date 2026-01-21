'use client';

import { ReactNode, Suspense, useEffect, useRef, useState } from 'react';
import { useSidebar } from '@/context/sidebar';
import { VANTABUDDY_CONFIG } from '@/lib/configs/sidebar';
import BreadcrumbNavigator from './header/breadcrumb-navigator';

interface PageWrapperProps {
  subheader: ReactNode;
  children: ReactNode;
}

export function PageWrapper({ subheader, children }: PageWrapperProps) {
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
        // Add the native event listener with passive: false if you need preventDefault
        element.addEventListener('wheel', handleWheel);
      }
  
      return () => {
        // Clean up the event listener on component unmount
        if (element) {
          element.removeEventListener('wheel', handleWheel);
        }
      };
    });

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
        ref={containerRef}
        style={{
          scrollBehavior: 'smooth',
        }}
      >
        <Suspense fallback={<div className="h-12 mb-4" />}>
          <BreadcrumbNavigator scrollPosition={scrollPosition} />
        </Suspense>
        {children}
      </div>
    </div>
  );
}
