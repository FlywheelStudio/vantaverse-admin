'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Loader2, X, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePendingUsers } from '../contexts/pending-users-context';
import { sendBulkInvitations, setOnboardingStateForUsers } from '../../actions';
import { type MemberRole } from '@/lib/supabase/schemas/organization-members';
import { cn } from '@/lib/utils';
import { type SetOnboardingStateTarget } from '@/lib/supabase/queries/profiles';

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase();
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-default';

  const variant =
    s === 'pending'
      ? 'bg-[oklch(0.95_0.05_55)] text-[oklch(0.34_0.14_55)]'
      : s === 'invited'
        ? 'bg-[oklch(0.95_0.03_262.705)] text-[oklch(0.42_0.2_262.705)]'
        : s === 'failed'
          ? 'bg-destructive/10 text-destructive'
          : s === 'active'
            ? 'bg-[oklch(0.94_0.04_155)] text-[oklch(0.32_0.12_155)]'
            : 'bg-muted text-foreground';

  return <span className={`${base} ${variant}`}>{status || 'unknown'}</span>;
}

function OnboardingBadge({
  screeningCompleted,
  consultationCompleted,
}: {
  screeningCompleted?: boolean;
  consultationCompleted?: boolean;
}) {
  if (consultationCompleted) {
    return (
      <span className="inline-flex items-center rounded-full bg-[oklch(0.95_0.03_262.705)] px-2 py-0.5 text-xs font-medium text-[oklch(0.42_0.2_262.705)]">
        Consultation
      </span>
    );
  }

  if (screeningCompleted) {
    return (
      <span className="inline-flex items-center rounded-full bg-[oklch(0.94_0.04_155)] px-2 py-0.5 text-xs font-medium text-[oklch(0.32_0.12_155)]">
        Screening
      </span>
    );
  }

  return null;
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-center">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function SelectAllCheckbox({
  selectableIds,
  selectedIds,
  setSelection,
  clearSelection,
  disabled,
}: {
  selectableIds: string[];
  selectedIds: Set<string>;
  setSelection: (ids: string[]) => void;
  clearSelection: () => void;
  disabled: boolean;
}) {
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.has(id));
  const someSelected =
    selectableIds.some((id) => selectedIds.has(id)) && !allSelected;

  return (
    <div className="flex items-center">
      <Checkbox
        checked={allSelected}
        indeterminate={someSelected}
        onCheckedChange={(value) =>
          value ? setSelection(selectableIds) : clearSelection()
        }
        disabled={selectableIds.length === 0 || disabled}
        aria-label="Select all"
      />
    </div>
  );
}

export function PendingUsersView({
  onClose,
  onAddMore,
  role = 'patient',
}: {
  onClose: () => void;
  onAddMore: () => void;
  role?: MemberRole;
}) {
  const {
    rows,
    counts,
    removeUser,
    markInvited,
    selectedIds,
    toggleSelection,
    clearSelection,
    setSelection,
    markOnboardingStep,
  } = usePendingUsers();
  const [sending, setSending] = useState(false);
  const [override, setOverride] = useState<'full' | SetOnboardingStateTarget>(
    'full',
  );
  const [overrideExpanded, setOverrideExpanded] = useState(false);

  const pendingRows = rows.filter(
    (r) => (r.status || '').toLowerCase() === 'pending',
  );
  const pendingEmails = pendingRows.map((r) => r.email);
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  const selectableIds = rows.filter((u) => isUuid(u.id)).map((u) => u.id);
  const selectedUserIds = rows
    .filter((u) => selectedIds.has(u.id) && isUuid(u.id))
    .map((u) => u.id);

  const applyOnboardingOverride = async (userIds: string[]) => {
    if (userIds.length === 0 || override === 'full') return { success: true as const };
    const result = await setOnboardingStateForUsers(
      userIds,
      override,
      { skipRevalidate: true },
    );
    if (result.success) markOnboardingStep(userIds, override);
    return result;
  };

  const handleSendInvitations = async () => {
    if (!pendingEmails.length || sending) return;
    setSending(true);
    try {
      const runOverride =
        selectedUserIds.length > 0 && override !== 'full';

      const [overrideResult, inviteResult] = await Promise.all([
        runOverride ? applyOnboardingOverride(selectedUserIds) : Promise.resolve({ success: true as const }),
        sendBulkInvitations(pendingEmails, role === 'admin'),
      ]);

      if (!overrideResult.success) {
        toast.error(overrideResult.error);
      }

      if (!inviteResult.success) {
        toast.error(inviteResult.error);
        return;
      }
      const { data } = inviteResult;
      const successful = data.results
        .filter((r) => r.success)
        .map((r) => r.email);
      if (successful.length) markInvited(successful);
      if (data.validationErrors?.length) {
        const msg = data.validationErrors
          .map((e) => `${e.email}: ${e.error}`)
          .join('; ');
        toast.error(`Validation: ${msg}`);
      }
      if (data.successful > 0) {
        toast.success(
          `Sent ${data.successful} invitation${data.successful > 1 ? 's' : ''}${data.failed > 0 ? `; ${data.failed} failed` : ''}`,
        );
      } else if (data.failed > 0) {
        toast.error(`All ${data.failed} invitation(s) failed`);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="space-y-1">
        <div className="text-2xl font-semibold text-foreground">Pending Users</div>
        <div className="text-sm text-muted-foreground">
          Review and manage users before sending invitations.
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <StatBox label="Pending" value={counts.pending} />
        <StatBox label="Invited" value={counts.invited} />
        <StatBox label="Active" value={counts.activeExisting} />
      </div>

      <div className="mt-4 flex flex-col flex-1 min-h-0 rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted/40 border-b border-border">
          <SelectAllCheckbox
            selectableIds={selectableIds}
            selectedIds={selectedIds}
            setSelection={setSelection}
            clearSelection={clearSelection}
            disabled={sending}
          />
          <div>Name</div>
          <div>Email</div>
          <div className="text-right">Status</div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {rows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">
                No users yet.
              </div>
            ) : (
              rows.map((u) => (
                <div
                  key={u.id}
                  className={`grid grid-cols-[auto_1fr_1fr_auto] items-center gap-3 px-4 py-3 ${
                    u.isOld ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedIds.has(u.id)}
                      onCheckedChange={() => toggleSelection(u.id)}
                      disabled={!isUuid(u.id) || sending}
                      aria-label={`Select user ${u.email}`}
                    />
                  </div>
                  <div className="text-sm text-foreground">
                    {
                      (u.firstName || u.lastName
                        ? `${u.firstName} ${u.lastName}`.trim()
                        : '—') as string
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                  <div className="flex items-center justify-end gap-2">
                    <StatusBadge status={u.status} />
                    <OnboardingBadge
                      screeningCompleted={u.screeningCompleted}
                      consultationCompleted={u.consultationCompleted}
                    />
                    <button
                      type="button"
                      onClick={() => removeUser(u.id)}
                      className="text-destructive hover:text-destructive"
                      aria-label="Remove user"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <div
        className={cn(
          'mt-4 rounded-md border px-4 py-3 text-sm',
          'border-primary/20 bg-primary/10 text-foreground',
        )}
      >
        Click &quot;Send Invitations&quot; to email all pending users.
        They&apos;ll move to &quot;Invited&quot; status.
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <button
          onClick={() => setOverrideExpanded(!overrideExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors focus:outline-none"
          type="button"
        >
          {overrideExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          Onboarding override
          {override !== 'full' && (
            <span className="text-xs font-normal text-muted-foreground">
              (Override active)
            </span>
          )}
        </button>

        {overrideExpanded && (
          <div className="mt-3 space-y-3 pl-6">
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="onboarding-override"
                  checked={override === 'full'}
                  onChange={() => setOverride('full')}
                  className="accent-primary h-4 w-4"
                  disabled={sending}
                />
                <span className="text-sm text-foreground">
                  Full onboarding (normal flow)
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="onboarding-override"
                  checked={override === 'screening'}
                  onChange={() => setOverride('screening')}
                  className="accent-primary h-4 w-4"
                  disabled={sending}
                />
                <span className="text-sm text-foreground">Skip screening</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="onboarding-override"
                  checked={override === 'consultation'}
                  onChange={() => setOverride('consultation')}
                  className="accent-primary h-4 w-4"
                  disabled={sending}
                />
                <span className="text-sm text-foreground">
                  Skip screening + consultation
                </span>
              </label>
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
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between gap-2">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onAddMore} disabled={sending}>
            + Add More Users
          </Button>
          <Button
            onClick={handleSendInvitations}
            className="rounded-pill"
            disabled={counts.pending === 0 || sending}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              `Send Invitations (${counts.pending})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
