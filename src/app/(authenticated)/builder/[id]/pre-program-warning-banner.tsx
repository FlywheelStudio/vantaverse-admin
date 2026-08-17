import { Alert } from '@/components/medvanta';

export function PreProgramWarningBanner(): React.ReactElement {
  return (
    <Alert kind="warning" title="You're editing the PreProgram." className="mb-6">
      <p>
        Saving publishes the workout to{' '}
        <span className="font-[var(--fw-semibold)] text-[var(--text-strong)]">every user</span>{' '}
        who is currently on it — there&apos;s no per-user copy and nothing to re-assign.
        Changes are live immediately.
      </p>
    </Alert>
  );
}
