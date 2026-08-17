'use client';

import { useState } from 'react';
import { Avatar, Icon } from '@/components/medvanta';
import { HtmlModal } from './intake-survey-placeholder-modal';
import { setOnboardingStateForUsers } from '../../actions';
import type { SetOnboardingStateTarget } from '@/lib/supabase/queries/profiles';
import { useRouter } from 'next/navigation';

type OnboardingOverride = 'full' | SetOnboardingStateTarget;

interface ChangeOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    status?: string | null;
  };
}

/** Copy + structure match HTML `mdChangeOnboarding`. */
const onboardingOptions = [
  {
    value: 'full' as const,
    label: 'Full onboarding',
    description:
      'All four gates: intake survey, screening appointment, virtual consultation, program assignment.',
  },
  {
    value: 'screening' as const,
    label: 'Skip the screening appointment',
    description:
      'Intake survey straight to the virtual consultation. Use when the member has already been screened in clinic.',
  },
  {
    value: 'consultation' as const,
    label: 'Skip screening and consultation',
    description:
      'Intake survey straight to program assignment. Use for members transferring in with a plan already agreed.',
  },
] as const;

export function ChangeOnboardingDialog({
  open,
  onOpenChange,
  user,
}: ChangeOnboardingDialogProps): React.ReactElement {
  const router = useRouter();
  const [override, setOverride] = useState<OnboardingOverride>('full');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
  const displayEmail = user.email ?? '';

  const handleClose = (): void => {
    onOpenChange(false);
  };

  const handleSave = async (): Promise<void> => {
    if (override === 'full') {
      onOpenChange(false);
      return;
    }
    setSaving(true);
    setError(null);
    const result = await setOnboardingStateForUsers([user.id], override);
    setSaving(false);
    if (result.success) {
      router.refresh();
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <HtmlModal
      open={open}
      onClose={handleClose}
      title="Change onboarding path"
      subtitle="Controls which gates this member has to clear."
      width={540}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-pri" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : null}
            Save path
          </button>
        </>
      }
    >
      <div
        className="row"
        style={{
          gap: 12,
          padding: '12px 14px',
          background: 'var(--slate-50)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 18,
        }}
      >
        <Avatar name={displayName} size="md" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 'var(--text-md)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-strong)',
            }}
          >
            {displayName}
          </span>
          <span
            className="mono"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
          >
            {displayEmail || '—'}
          </span>
        </span>
        <span className="bdg bdg-b">Onboarding</span>
      </div>

      <label className="lbl" style={{ marginBottom: 9, display: 'block' }}>
        Onboarding path
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {onboardingOptions.map(({ value, label, description }) => {
          const selected = override === value;
          return (
            <button
              key={value}
              type="button"
              className={`choice${selected ? ' on' : ''}`}
              disabled={saving}
              onClick={() => setOverride(value)}
            >
              <span className={`rd${selected ? ' on' : ''}`}>{selected ? <i /> : null}</span>
              <span>
                <span className="ct">{label}</span>
                <span className="cd">{description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {override !== 'full' ? (
        <div className="alert alert-w" style={{ marginTop: 16 }}>
          <Icon name="TriangleAlert" size={19} />
          <div>
            <div className="at">
              Skipping a completed gate hides it from their path but keeps the record
            </div>
            Restoring it later requires resetting onboarding.
          </div>
        </div>
      ) : null}

      {error ? (
        <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
    </HtmlModal>
  );
}
