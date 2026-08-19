interface ProgressBarUiProps {
  clamped: number;
  height: 4 | 6 | 8;
  barClass: string;
  showLabel: boolean;
}

/** HTML `.pb` / `.pbw` progress row used in dashboard cards. */
export function ProgressBarUi({
  clamped,
  height,
  barClass,
  showLabel,
}: ProgressBarUiProps): React.ReactElement {
  return (
    <div className="pbw">
      <span className={barClass} style={{ height }}>
        <i style={{ width: `${clamped}%` }} />
      </span>
      {showLabel ? <span className="v">{clamped}%</span> : null}
    </div>
  );
}
