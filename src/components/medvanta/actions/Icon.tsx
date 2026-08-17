'use client';

import * as Lucide from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { cn } from '../utils/cn';

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Renders a Lucide glyph by PascalCase name; returns null if the icon is missing. */
export function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  className,
  style,
}: IconProps): React.ReactNode {
  const Comp = (Lucide as Record<string, React.ComponentType<LucideProps>>)[name];
  if (!Comp) return null;
  return (
    <Comp
      size={size}
      strokeWidth={strokeWidth}
      className={cn(className)}
      style={style}
      aria-hidden
    />
  );
}
