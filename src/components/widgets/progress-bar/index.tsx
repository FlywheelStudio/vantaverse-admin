import { ProgressBarUi } from './ui';

export function ProgressBar({
  pct,
  height = 6,
  tone = 'navy',
  showLabel = true,
}: {
  pct: number;
  height?: 4 | 6 | 8;
  tone?: 'navy' | 'cyan' | 'danger';
  showLabel?: boolean;
}): React.ReactElement {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const barClass =
    tone === 'cyan' ? 'pb pb-6 pb-c' : tone === 'danger' ? 'pb pb-6 pb-d' : 'pb pb-6 pb-n';

  return (
    <ProgressBarUi
      clamped={clamped}
      height={height}
      barClass={barClass}
      showLabel={showLabel}
    />
  );
}
