import { Icon } from '@/components/medvanta';

interface VantapointsCardProps {
  level: number | null;
  hpPoints: number | null;
  pointsForNextLevel: number | null;
  pointsMissingForNextLevel: number | null;
}

function computeProgress(args: {
  level: number | null;
  hpPoints: number | null;
  pointsForNextLevel: number | null;
  pointsMissingForNextLevel: number | null;
}): { pct: number; progressLabel: string; pointsText: string } {
  const nextLevel =
    args.level != null ? args.level + 1 : null;
  const progressLabel =
    nextLevel != null
      ? `Progress to Level ${nextLevel}`
      : 'Progress to next level';

  if (
    args.hpPoints != null &&
    args.pointsForNextLevel != null &&
    args.pointsForNextLevel > 0
  ) {
    const pct = Math.min(
      100,
      Math.round((args.hpPoints / args.pointsForNextLevel) * 100),
    );
    return {
      pct,
      progressLabel,
      pointsText: `${args.hpPoints} / ${args.pointsForNextLevel} pts`,
    };
  }

  if (
    args.pointsForNextLevel != null &&
    args.pointsForNextLevel > 0 &&
    args.pointsMissingForNextLevel != null
  ) {
    const earned = Math.max(
      0,
      args.pointsForNextLevel - args.pointsMissingForNextLevel,
    );
    const pct = Math.min(
      100,
      Math.round((earned / args.pointsForNextLevel) * 100),
    );
    return {
      pct,
      progressLabel,
      pointsText: `${earned} / ${args.pointsForNextLevel} pts`,
    };
  }

  return { pct: 0, progressLabel, pointsText: '—' };
}

/** Navy VantaPoints summary card (`scMemberDetail` insights rail). */
export function VantapointsCard({
  level,
  hpPoints,
  pointsForNextLevel,
  pointsMissingForNextLevel,
}: VantapointsCardProps): React.ReactElement {
  const { pct, progressLabel, pointsText } = computeProgress({
    level,
    hpPoints,
    pointsForNextLevel,
    pointsMissingForNextLevel,
  });

  return (
    <div
      style={{
        background: 'var(--navy-900)',
        borderRadius: 'var(--radius-sm)',
        padding: 18,
        color: 'var(--white)',
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 130,
          height: 130,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, color-mix(in oklch, var(--cyan-500) 35%, transparent), transparent 70%)',
        }}
      />
      <div className="row" style={{ gap: 8, position: 'relative' }}>
        <Icon name="Award" size={17} style={{ color: 'var(--cyan-300)' }} />
        <span
          style={{
            fontSize: 'var(--text-2xs)',
            fontWeight: 800,
            letterSpacing: '.12em',
            color: 'var(--cyan-200)',
          }}
        >
          VANTAPOINTS
        </span>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: '-.02em',
          margin: '9px 0 14px',
          position: 'relative',
        }}
      >
        {level != null ? `Level ${level}` : '—'}
      </div>
      <div
        className="row"
        style={{
          justifyContent: 'space-between',
          fontSize: 'var(--text-xs)',
          color: 'var(--navy-200)',
          marginBottom: 6,
          position: 'relative',
        }}
      >
        <span>{progressLabel}</span>
        <span className="mono">{pointsText}</span>
      </div>
      <span
        className="pb pb-6"
        style={{
          background: 'rgba(255,255,255,.16)',
          display: 'block',
          position: 'relative',
        }}
      >
        <i style={{ width: `${pct}%`, background: 'var(--cyan-400)' }} />
      </span>
    </div>
  );
}
