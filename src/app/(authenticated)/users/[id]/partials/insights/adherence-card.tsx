import type { AdherencePeriod } from '../program-week';

export interface PreprogramEngagementRow {
  label: string;
  value: string;
  pct: number;
}

interface AdherenceCardPropsAssigned {
  variant: 'assigned';
  periods: AdherencePeriod[];
}

interface AdherenceCardPropsPreprogram {
  variant: 'preprogram';
  rows: PreprogramEngagementRow[];
}

type AdherenceCardProps = AdherenceCardPropsAssigned | AdherenceCardPropsPreprogram;

function formatPeriodValue(period: AdherencePeriod): string {
  if (period.expectedSessions > 0) {
    return `${period.doneSessions} of ${period.expectedSessions} sessions`;
  }
  if (period.label === '4-week average' && period.pct > 0) {
    const avgSessions = ((period.pct / 100) * 4).toFixed(1);
    return `${avgSessions} of 4`;
  }
  return '—';
}

function clampPct(pct: number): number {
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function AdherenceRow({
  label,
  value,
  pct,
  isLast,
}: {
  label: string;
  value: string;
  pct: number;
  isLast?: boolean;
}): React.ReactElement {
  return (
    <div style={{ marginBottom: isLast ? 0 : 15 }}>
      <div
        className="row"
        style={{ justifyContent: 'space-between', marginBottom: 7 }}
      >
        <span style={{ fontSize: 'var(--text-sm)' }}>{label}</span>
        <span
          className="mono"
          style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
        >
          {value}
        </span>
      </div>
      <span className="pb pb-4 pb-n" style={{ display: 'block' }}>
        <i style={{ width: `${clampPct(pct)}%` }} />
      </span>
    </div>
  );
}

/** Adherence or pre-program engagement card (`scMemberDetail` insights rail). */
export function AdherenceCard(props: AdherenceCardProps): React.ReactElement {
  if (props.variant === 'assigned') {
    const periods = props.periods;

    return (
      <div className="card">
        <div className="ch" style={{ marginBottom: 12 }}>
          <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
            Adherence
          </div>
        </div>
        {periods.map((period, index) => (
          <AdherenceRow
            key={period.label}
            label={period.label}
            value={formatPeriodValue(period)}
            pct={period.pct}
            isLast={index === periods.length - 1}
          />
        ))}
      </div>
    );
  }

  const rows = props.rows;

  return (
    <div className="card">
      <div className="ch" style={{ marginBottom: 12 }}>
        <div>
          <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
            Pre-program engagement
          </div>
          <div className="ch-s">While awaiting a real program</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
          No engagement metrics on file.
        </p>
      ) : (
        rows.map((row, index) => (
          <AdherenceRow
            key={row.label}
            label={row.label}
            value={row.value}
            pct={row.pct}
            isLast={index === rows.length - 1}
          />
        ))
      )}
      <div className="hint">
        Engagement on the shared Pre-program is not counted in completion metrics.
      </div>
    </div>
  );
}
