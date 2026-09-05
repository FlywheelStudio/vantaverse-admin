import { DonutUi } from './ui';

 interface DonutProps {
  pct: number;
  size?: number;
  label: string;
  sub?: string;
  /** Completed / filled arc. */
  color?: string;
  /** Remaining / in-progress track. */
  trackColor?: string;
}

/** HTML `donut()` SVG ring matching the prototype. */
export function Donut({
  pct,
  size = 158,
  label,
  sub = 'aggregate',
  color = 'var(--navy-600)',
  trackColor = 'var(--cyan-500)',
}: DonutProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, pct));
  const radius = size / 2 - 13;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <DonutUi
      size={size}
      radius={radius}
      circumference={circumference}
      offset={offset}
      label={label}
      sub={sub}
      color={color}
      trackColor={trackColor}
    />
  );
}
