import { Icon } from '../actions/Icon';
import { cn } from '../utils/cn';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  delta?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: string;
  accent?: string;
  spark?: number[];
  sparkId?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface SparklineProps {
  data: number[];
  color: string;
  id: string;
}

function Sparkline({ data, color, id }: SparklineProps): React.ReactElement {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 30;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = points.join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block h-[30px] w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${id})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** KPI tile: label, big value, trend delta, optional sparkline. */
export function StatCard({
  label,
  value,
  delta,
  trend = 'flat',
  icon,
  accent = 'var(--accent)',
  spark,
  sparkId = 'mvspark',
  className,
  style,
}: StatCardProps): React.ReactElement {
  const trendColor =
    trend === 'up'
      ? 'var(--success)'
      : trend === 'down'
        ? 'var(--danger)'
        : 'var(--text-muted)';
  const trendIcon =
    trend === 'up' ? 'TrendingUp' : trend === 'down' ? 'TrendingDown' : 'Minus';

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 shadow-[var(--shadow-sm)]',
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between">
        <span className="text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--text-muted)]">
          {label}
        </span>
        {icon ? (
          <span
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[var(--radius-sm)]"
            style={{
              background: `color-mix(in oklch, ${accent} 12%, transparent)`,
              color: accent,
            }}
          >
            <Icon name={icon} size={18} />
          </span>
        ) : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-[length:var(--text-3xl)] font-[var(--fw-extrabold)] leading-none tracking-[var(--tracking-tight)] text-[var(--text-strong)] [font-variant-numeric:tabular-nums]">
          {value}
        </div>
        {delta ? (
          <div
            className="flex items-center gap-1 whitespace-nowrap text-[length:var(--text-sm)] font-[var(--fw-semibold)]"
            style={{ color: trendColor }}
          >
            <Icon name={trendIcon} size={15} />
            {delta}
          </div>
        ) : null}
      </div>
      {spark ? (
        <div className="-mx-5 -mb-5 mt-[-2px] opacity-95">
          <Sparkline data={spark} color={accent} id={sparkId} />
        </div>
      ) : null}
    </div>
  );
}
