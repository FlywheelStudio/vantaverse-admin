'use client';

import { useRouter } from 'next/navigation';
import { Alert, Avatar, Button, Card } from '@/components/medvanta';
import type { PhysicianInfo } from '../hooks/use-groups';

export function PhysicianCard({
  physician,
  onAssignClick,
  organizationId,
}: {
  physician: PhysicianInfo | null;
  onAssignClick: () => void;
  organizationId: string;
}) {
  const router = useRouter();
  const fullName =
    physician?.firstName && physician?.lastName
      ? `${physician.firstName} ${physician.lastName}`
      : physician?.firstName || physician?.lastName || null;

  if (!physician) {
    return (
      <Card className="flex h-full flex-col justify-center">
        <Alert kind="warning" title="No admin assigned">
          Assign an admin to co-manage this group.
        </Alert>
        <div className="mt-4">
          <Button onClick={onAssignClick} iconLeft="UserPlus">
            Assign admin to co-manage
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-1 items-start justify-between gap-4">
        <button
          type="button"
          className="min-w-0 flex-1 cursor-pointer text-left"
          onClick={() =>
            router.push(`/users/${physician.userId}?from=/groups/${organizationId}`)
          }
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar
              name={fullName || 'Admin'}
              src={physician.avatarUrl || undefined}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-[var(--fw-semibold)] text-[var(--text-strong)]">
                {fullName || 'Admin'}
              </div>
              <div className="truncate text-[length:var(--text-sm)] text-[var(--text-muted)]">
                {physician.email || '—'}
              </div>
            </div>
          </div>
          {physician.description ? (
            <div className="mt-2 text-[length:var(--text-sm)] italic text-[var(--text-muted)]">
              {physician.description}
            </div>
          ) : null}
        </button>
        <Button variant="secondary" className="shrink-0" onClick={onAssignClick}>
          Change
        </Button>
      </div>
    </Card>
  );
}
