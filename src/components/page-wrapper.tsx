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
    <div className="h-full w-full flex flex-col pr-4">
      <div
        suppressHydrationWarning
        className="text-white flex items-center shrink-0"
        style={{
          paddingLeft: `${paddingLeft}px`,
          height: `${VANTABUDDY_CONFIG.height}px`,
        }}
      >
        {subheader}
      </div>
      <div className="pl-4 pt-4 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
