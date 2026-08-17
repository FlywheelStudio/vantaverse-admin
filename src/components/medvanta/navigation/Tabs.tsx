'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../utils/cn';

export interface TabItem {
  id: string;
  label: React.ReactNode;
}

export interface TabsProps {
  tabs?: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_TABS: TabItem[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'details', label: 'Details' },
  { id: 'history', label: 'History' },
];

/** Underline tab bar — Radix-backed, MedVanta navy/cyan styling. */
export function Tabs({
  tabs = DEFAULT_TABS,
  value,
  defaultValue,
  onChange,
  className,
  style,
}: TabsProps): React.ReactElement {
  const initial = defaultValue ?? tabs[0]?.id;

  return (
    <TabsPrimitive.Root
      value={value}
      defaultValue={value === undefined ? initial : undefined}
      onValueChange={onChange}
      className={cn('w-full', className)}
      style={style}
    >
      <TabsPrimitive.List
        className={cn(
          'inline-flex w-full items-end gap-6 border-b border-[var(--border-subtle)]',
        )}
        aria-label="Tabs"
      >
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.id}
            value={tab.id}
            className={cn(
              'relative -mb-px inline-flex items-center justify-center px-1 pb-3 pt-1',
              'text-[length:var(--text-md)] font-[var(--fw-medium)] text-[var(--text-muted)]',
              'transition-colors duration-[var(--dur-fast)]',
              'hover:text-[var(--text-strong)]',
              'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
              'data-[state=active]:font-[var(--fw-semibold)] data-[state=active]:text-[var(--text-strong)]',
              'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-[var(--accent)] after:transition-transform after:duration-[var(--dur-base)]',
              'data-[state=active]:after:scale-x-100',
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
