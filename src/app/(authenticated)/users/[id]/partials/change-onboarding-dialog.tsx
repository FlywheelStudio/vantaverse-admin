'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
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

const statusLabel: Record<string, string> = {
  pending: 'pending',
  invited: 'invited',
  active: 'active',
  assigned: 'assigned',
};

const onboardingOptions = [
  {
    value: 'full' as const,
    label: 'Full onboarding',
    description: 'Member completes screening, consultation, and intake as normal.',
  },
  {
    value: 'screening' as const,
    label: 'Skip screening',
    description: 'Member starts at consultation; screening answers are skipped.',
  },
  {
    value: 'consultation' as const,
    label: 'Skip screening + consultation',
    description: 'Member starts at intake survey only.',
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
  const status = user.status ? (statusLabel[user.status] ?? user.status) : null;

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
      subtitle={`Override the default onboarding flow for ${displayName}.`}
      width={540}
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-pri" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Icon name="LoaderCircle" size={17} className="animate-spin" />
            ) : (
              <Icon name="Save" size={17} />
            )}
            Save override
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
          borderRadius: 'var(--radius-sm)',
          marginBottom: 18,
        }}
      >
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
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {displayEmail}
          </span>
        </span>
        {status ? <span className="bdg bdg-b">{status}</span> : null}
      </div>

      <div className="g g1" style={{ gap: 10 }}>
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
              <span className={`rd${selected ? ' on' : ''}`}>
                {selected ? <i /> : null}
              </span>
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-md)',
                    fontWeight: 'var(--fw-semibold)',
                    color: 'var(--text-strong)',
                  }}
                >
                  {label}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                  {description}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {override !== 'full' ? (
        <div className="alert alert-w" style={{ marginTop: 16 }}>
          <Icon name="TriangleAlert" size={19} />
          <div>
            Skipping onboarding steps may confuse invited members. Use only in exceptional
            situations.
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
