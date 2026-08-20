import { Icon } from '@/components/medvanta';

interface EmpowermentCardProps {
  empowerment: number | null;
  title: string | null;
}

/** Compact Empowerment score card (`scMemberDetail` insights rail). */
export function EmpowermentCard({
  empowerment,
  title,
}: EmpowermentCardProps): React.ReactElement {
  const pct = Math.max(0, Math.min(100, Math.round(empowerment ?? 0)));

  return (
    <div className="card" style={{ padding: 15 }}>
      <div className="row" style={{ gap: 7, marginBottom: 9 }}>
        <Icon name="Shield" size={16} style={{ color: 'var(--navy-600)' }} />
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-muted)',
          }}
        >
          Empowerment
        </span>
      </div>
      <div
        style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: 800,
          color: 'var(--text-strong)',
          letterSpacing: '-.02em',
        }}
      >
        {empowerment != null ? `${pct}%` : '—'}
      </div>
      <span className="pb pb-4 pb-n" style={{ display: 'block', margin: '9px 0 7px' }}>
        <i style={{ width: `${pct}%` }} />
      </span>
      {title ? (
        <span className="bdg" style={{ fontSize: 10.5 }}>
          {title}
        </span>
      ) : null}
    </div>
  );
}
