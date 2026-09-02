'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@/components/medvanta';
import type { HabitPledge } from '@/lib/supabase/queries/habit-pledge';
import { HtmlModal } from '../intake-survey-placeholder-modal';

interface PledgeCardProps {
  habitPledge: HabitPledge | null;
}

function formatPledgeDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function PledgeViewModal({
  open,
  onOpenChange,
  pledge,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pledge: HabitPledge;
}): React.ReactElement {
  const handleClose = (): void => onOpenChange(false);

  return (
    <HtmlModal
      open={open}
      onClose={handleClose}
      title="Habit pledge"
      subtitle={`Signed ${formatPledgeDate(pledge.created_at)}`}
      width={560}
      footer={
        <button type="button" className="btn btn-pri" onClick={handleClose}>
          Close
        </button>
      }
    >
      <p
        style={{
          margin: '0 0 18px',
          fontSize: 'var(--text-sm)',
          color: 'var(--text-body)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {pledge.pledge}
      </p>
      <div
        className="g g2"
        style={{ gap: 12, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
      >
        {pledge.photo?.image_url ? (
          <figure style={{ margin: 0 }}>
            <figcaption
              style={{
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
                marginBottom: 6,
              }}
            >
              Photo
            </figcaption>
            <Image
              src={pledge.photo.image_url}
              alt="Pledge photo"
              width={240}
              height={180}
              unoptimized
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            />
          </figure>
        ) : null}
        {pledge.signature?.image_url ? (
          <figure style={{ margin: 0 }}>
            <figcaption
              style={{
                fontSize: 'var(--text-2xs)',
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-faint)',
                marginBottom: 6,
              }}
            >
              Signature
            </figcaption>
            <Image
              src={pledge.signature.image_url}
              alt="Pledge signature"
              width={240}
              height={120}
              unoptimized
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-card)',
              }}
            />
          </figure>
        ) : null}
      </div>
    </HtmlModal>
  );
}

/** Pledge summary card with expand dialog (`scMemberDetail` insights rail). */
export function PledgeCard({ habitPledge }: PledgeCardProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const signed = habitPledge != null;

  return (
    <>
      <div className="card" style={{ padding: 15 }}>
        <div className="row" style={{ gap: 7, marginBottom: 9 }}>
          <Icon name="FileText" size={16} style={{ color: 'var(--navy-600)' }} />
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-muted)',
            }}
          >
            Pledge
          </span>
        </div>
        <div
          className="row"
          style={{
            gap: 6,
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-strong)',
          }}
        >
          {signed ? (
            <>
              <Icon name="CircleCheck" size={17} style={{ color: 'var(--navy-600)' }} />
              Signed
            </>
          ) : (
            'Not signed'
          )}
        </div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            margin: '5px 0 9px',
          }}
        >
          {signed ? formatPledgeDate(habitPledge.created_at) : '—'}
        </div>
        {signed ? (
          <button
            type="button"
            className="lnk"
            style={{
              fontSize: 'var(--text-sm)',
              background: 'none',
              border: 'none',
              padding: 0,
            }}
            onClick={() => setOpen(true)}
          >
            View pledge →
          </button>
        ) : null}
      </div>

      {signed ? (
        <PledgeViewModal open={open} onOpenChange={setOpen} pledge={habitPledge} />
      ) : null}
    </>
  );
}
