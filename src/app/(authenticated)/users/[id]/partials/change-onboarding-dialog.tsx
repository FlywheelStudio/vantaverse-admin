'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { setOnboardingStateForUsers } from '../../actions';
import type { SetOnboardingStateTarget } from '@/lib/supabase/queries/profiles';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type OnboardingOverride = 'full' | SetOnboardingStateTarget;

type ChangeOnboardingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    status?: string | null;
  };
};

const statusLabel: Record<string, string> = {
  pending: 'pending',
  invited: 'invited',
  active: 'active',
  assigned: 'assigned',
};

export function ChangeOnboardingDialog({
  open,
  onOpenChange,
  user,
}: ChangeOnboardingDialogProps) {
  const router = useRouter();
  const [override, setOverride] = useState<OnboardingOverride>('full');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'User';
  const displayEmail = user.email ?? '';
  const status = user.status ? statusLabel[user.status] ?? user.status : null;

  const handleSave = async () => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Onboarding</DialogTitle>
          <DialogDescription>
            Modify the onboarding path for this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">{displayName}</p>
              <p className="text-sm text-muted-foreground">{displayEmail}</p>
            </div>
            {status && (
              <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                {status}
              </span>
            )}
          </div>

          <div>
            <p className="mb-2 font-medium text-foreground">Onboarding override</p>
            <div className="space-y-1 rounded-md border border-border bg-muted/30">
              {(
                [
                  { value: 'full' as const, label: 'Full onboarding' },
                  { value: 'screening' as const, label: 'Skip screening' },
                  {
                    value: 'consultation' as const,
                    label: 'Skip screening + consultation',
                  },
                ] as const
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm transition-colors',
                    override === value && 'bg-primary/10',
                  )}
                >
                  <input
                    type="radio"
                    name="onboarding-override"
                    checked={override === value}
                    onChange={() => setOverride(value)}
                    className="h-4 w-4 accent-primary"
                    disabled={saving}
                  />
                  <span className="text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {override !== 'full' && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                Skipping onboarding steps may result in a confusing experience for
                invited users. Only use this override in exceptional situations.
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className="ml-2" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
