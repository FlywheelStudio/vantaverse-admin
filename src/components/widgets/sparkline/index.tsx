'use client';

import { SparklineUi } from './ui';

export function Sparkline({
  values,
  color = 'var(--navy-600)',
  height = 28,
  className,
}: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
}): React.ReactElement | null {
  if (!values.length) return null;

  const w = 120;
  const h = height;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = pts.join(' ');
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `spk-${values.join('-').slice(0, 24)}`;

  return (
    <SparklineUi
      line={line}
      area={area}
      gid={gid}
      color={color}
      height={h}
      className={className}
      w={w}
    />
  );
}
