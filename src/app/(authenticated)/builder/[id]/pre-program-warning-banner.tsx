import { Icon } from '@/components/medvanta';

export function PreProgramWarningBanner(): React.ReactElement {
  return (
    <div className="alert alert-w" style={{ marginBottom: 18 }}>
      <Icon name="TriangleAlert" size={19} />
      <div>
        <div className="at">You&apos;re editing the PreProgram.</div>
        <div>
          Saving publishes the workout to{' '}
          <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
            every user
          </span>{' '}
          who is currently on it — there&apos;s no per-user copy and nothing to re-assign. Changes
          are live immediately.
        </div>
      </div>
    </div>
  );
}
