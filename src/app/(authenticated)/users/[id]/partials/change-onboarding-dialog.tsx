'use client';

import { useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  FormField,
  Radio,
} from '@/components/medvanta';
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
  { value: 'full' as const, label: 'Full onboarding' },
  { value: 'screening' as const, label: 'Skip screening' },
  {
    value: 'consultation' as const,
    label: 'Skip screening + consultation',
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
    <Dialog
      open={open}
      onClose={handleClose}
      title="Change Onboarding"
      width={448}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </>
      }
    >
      <p className="mb-4 text-[length:var(--text-sm)] text-[var(--text-muted)]">
        Modify the onboarding path for this user.
      </p>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-[var(--fw-semibold)] text-[var(--text-strong)]">
            {displayName}
          </p>
          <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
            {displayEmail}
          </p>
        </div>
        {status ? <Badge tone="brand">{status}</Badge> : null}
      </div>

      <FormField label="Onboarding override">
        <div className="space-y-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--slate-50)] p-3">
          {onboardingOptions.map(({ value, label }) => (
            <Radio
              key={value}
              name="onboarding-override"
              value={value}
              label={label}
              checked={override === value}
              disabled={saving}
              onChange={() => setOverride(value)}
            />
          ))}
        </div>
      </FormField>

      {override !== 'full' ? (
        <Alert kind="warning" className="mt-4">
          Skipping onboarding steps may result in a confusing experience for
          invited users. Only use this override in exceptional situations.
        </Alert>
      ) : null}

      {error ? (
        <p className="mt-3 text-[length:var(--text-sm)] text-[var(--danger)]">
          {error}
        </p>
      ) : null}
    </Dialog>
  );
}
