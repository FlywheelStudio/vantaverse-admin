import { ProgressBarUi } from './ui';

export function ProgressBar({
  pct,
  height,
  tone = 'accent',
  showLabel = true,
}: {
  pct: number;
  height?: number;
  tone?: 'accent' | 'navy' | 'cyan' | 'danger';
  showLabel?: boolean;
}): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const barClass =
    tone === 'danger' ? 'pb pb-d' : 'pb pb-c';

  return (
    <ProgressBarUi
      clamped={clamped}
      height={height}
      barClass={barClass}
      showLabel={showLabel}
    />
  );
}
