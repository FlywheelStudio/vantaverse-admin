'use client';

import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Icon } from '@/components/medvanta';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import { cn } from '@/lib/utils';

const STATUS_CHIPS = [
  { label: 'Always active', tone: 'success' as const },
  { label: 'Auto-assigned to all users', tone: 'brand' as const },
  { label: 'Editing updates it for everyone', tone: 'warning' as const },
];

interface PreProgramCardProps {
  assignment: ProgramAssignmentWithTemplate;
}

export function PreProgramCard({ assignment }: PreProgramCardProps): React.ReactElement | null {
  const router = useRouter();
  const template = assignment.program_template;

  if (!template) {
    return null;
  }

  const weeksLabel = `${template.weeks} ${template.weeks === 1 ? 'week' : 'weeks'}`;

  return (
    <div
      className={cn(
        'relative mb-6 rounded-[var(--radius-sm)] p-px',
        'bg-linear-to-r from-[var(--warning)] via-[var(--accent)] to-[var(--warning)]',
      )}
    >
      <Card padding={20} className="rounded-[calc(var(--radius-sm)-1px)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--warning-soft)] bg-[var(--warning-soft)]"
              aria-hidden
            >
              <Icon name="Anchor" size={28} className="text-[var(--warning)]" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[length:var(--text-xl)] font-[var(--fw-semibold)] text-[var(--text-strong)]">
                  {template.name}
                </h2>
                <Badge tone="brand">Anchored</Badge>
              </div>

              <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                <span className="font-[var(--fw-medium)] text-[var(--text-strong)]">
                  {weeksLabel}
                </span>
                {template.description ? <> · {template.description}</> : null}
              </p>

              <div className="flex flex-wrap gap-2">
                {STATUS_CHIPS.map((chip) => (
                  <Badge key={chip.label} tone={chip.tone}>
                    {chip.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="shrink-0"
            onClick={() => router.push(`/builder/${assignment.id}`)}
          >
            Edit PreProgram
          </Button>
        </div>
      </Card>
    </div>
  );
}
