'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@/components/medvanta';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import { usePreheat } from '@/hooks/use-preheat';

interface PreProgramCardProps {
  assignment: ProgramAssignmentWithTemplate;
}

export function PreProgramCard({ assignment }: PreProgramCardProps): React.ReactElement | null {
  const router = useRouter();
  const { getPreheatHandlers } = usePreheat();
  const template = assignment.program_template;

  if (!template) {
    return null;
  }

  const weeksLabel = `${template.weeks} ${template.weeks === 1 ? 'week' : 'weeks'}`;
  const builderHref = `/builder/${assignment.id}`;
  const preheatHandlers = getPreheatHandlers(builderHref);

  return (
    <div
      className="card"
      style={{
        background: 'var(--navy-50)',
        borderColor: 'var(--navy-200)',
        boxShadow: 'none',
        padding: '16px 20px',
        marginBottom: 18,
      }}
    >
      <div className="row" style={{ gap: 14 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--navy-100)',
            color: 'var(--navy-700)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <Icon name="Pin" size={20} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 9 }}>
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--text-strong)',
              }}
            >
              Pre-program
            </span>
            <span className="bdg bdg-inv">Anchored</span>
          </div>
          <div
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-body)',
              marginTop: 3,
            }}
          >
            {weeksLabel} · Auto-assigned to every new member while they wait for a personalised
            program
            {template.description ? <> · {template.description}</> : null}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sec"
          onClick={() => router.push(builderHref)}
          {...preheatHandlers}
        >
          <Icon name="SquarePen" size={17} />
          Edit pre-program
        </button>
      </div>
    </div>
  );
}
