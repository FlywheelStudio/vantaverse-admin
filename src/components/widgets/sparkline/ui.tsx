interface SparklineUiProps {
  line: string;
  area: string;
  gid: string;
  color: string;
  height: number;
  className?: string;
  w: number;
}

/** SVG sparkline markup (area + stroke). */
export function SparklineUi({
  line,
  area,
  gid,
  color,
  height,
  className,
  w,
}: SparklineUiProps): React.ReactElement {
  return (
    <svg
      className={className}
      width="100%"
      height={height}
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
