'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Avatar, Icon } from '@/components/medvanta';
import { HtmlModal } from './intake-survey-placeholder-modal';
import { setOnboardingStateForUsers } from '../../actions';
import type { SetOnboardingStateTarget } from '@/lib/supabase/queries/profiles';
import { useRouter } from 'next/navigation';
import {
  DEFAULT_ONBOARDING_GATE_INDEX,
  formatClearedGatesAlertTitle,
  formatGateBadge,
} from './change-onboarding-mock-data';

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
  /** Preselect path when parent knows the current override. */
  currentPath?: OnboardingOverride;
  /** 0-based gate index for badge + cleared-gates copy (mock default 2). */
  gateIndex?: number;
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

function ChangeOnboardingDialogBody({
  onOpenChange,
  user,
  currentPath,
  gateIndex = DEFAULT_ONBOARDING_GATE_INDEX,
}: Omit<ChangeOnboardingDialogProps, 'open'>): React.ReactElement {
  const router = useRouter();
  const [override, setOverride] = useState<OnboardingOverride>(
    currentPath ?? 'full',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
  const displayEmail = user.email ?? '';
  const firstName =
    user.first_name?.trim() || displayName.split(' ')[0] || 'Member';

  const handleClose = (): void => {
    onOpenChange(false);
  };

  const handleSave = async (): Promise<void> => {
    if (override === 'full') {
      toast.success('Restored full onboarding (preview)');
      router.refresh();
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
      open
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
        <span className="bdg bdg-b">{formatGateBadge(gateIndex)}</span>
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

      <div className="alert alert-w" style={{ marginTop: 16 }}>
        <Icon name="TriangleAlert" size={19} />
        <div>
          <div className="at">{formatClearedGatesAlertTitle(firstName, gateIndex)}</div>
          Skipping a completed gate hides it from their path but keeps the record.
          Restoring it later requires resetting onboarding.
        </div>
      </div>

      {error ? (
        <p style={{ marginTop: 12, fontSize: 'var(--text-sm)', color: 'var(--danger)' }}>
          {error}
        </p>
      ) : null}
    </HtmlModal>
  );
}

/**
 * Change onboarding path dialog (HTML `mdChangeOnboarding`).
 * Remounts on open so path/gate state resets without effect setState.
 */
export function ChangeOnboardingDialog({
  open,
  ...props
}: ChangeOnboardingDialogProps): React.ReactElement | null {
  if (!open) return null;
  return (
    <ChangeOnboardingDialogBody
      key={`onboarding-${props.currentPath ?? 'full'}-${props.gateIndex ?? DEFAULT_ONBOARDING_GATE_INDEX}`}
      {...props}
    />
  );
}
