/** HTML `.pb` / `.pbw` progress row used in dashboard cards. */
export function HtmlProgressBar({
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
    <div className="pbw">
      <span className={barClass} style={{ height }}>
        <i style={{ width: `${clamped}%` }} />
      </span>
      {showLabel ? <span className="v">{clamped}%</span> : null}
    </div>
  );
}
