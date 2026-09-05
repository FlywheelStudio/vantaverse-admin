interface DonutUiProps {
  size: number;
  radius: number;
  circumference: number;
  offset: number;
  label: string;
  sub: string;
  color: string;
  trackColor: string;
}

/** HTML `donut()` SVG ring matching the prototype. */
export function DonutUi({
  size,
  radius,
  circumference,
  offset,
  label,
  sub,
  color,
  trackColor,
}: DonutUiProps): React.ReactElement {
  return (
    <div
      style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={18}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={18}
          strokeLinecap="round"
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <div
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 'var(--fw-extrabold)',
            color: 'var(--text-strong)',
            letterSpacing: 'var(--tracking-tight)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            fontWeight: 'var(--fw-semibold)',
          }}
        >
          {sub}
        </div>
      </div>
    </div>
  );
}
