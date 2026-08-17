'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge, Card, IconButton } from '@/components/medvanta';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface ProgramTemplateCardProps {
  assignment: ProgramAssignmentWithTemplate;
  onClick: () => void;
  onDelete?: () => void;
  onClone?: () => void;
}

export function ProgramTemplateCard({
  assignment,
  onClick,
  onDelete,
  onClone,
}: ProgramTemplateCardProps): React.ReactElement | null {
  const template = assignment.program_template;

  if (!template) {
    return null;
  }

  const handleDelete = async (): Promise<void> => {
    if (onDelete) {
      await onDelete();
    }
  };

  const getImageUrl = (): string | null => {
    if (!template.image_url) {
      return null;
    }

    if (typeof template.image_url === 'string') {
      return template.image_url;
    }

    if (
      typeof template.image_url === 'object' &&
      template.image_url !== null &&
      'image_url' in template.image_url
    ) {
      return String(template.image_url.image_url);
    }

    return null;
  };

  const imageUrl = getImageUrl();

  const profiles = assignment.profiles as
    | {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      }
    | null
    | undefined;
  const userName = profiles
    ? [profiles.first_name, profiles.last_name].filter(Boolean).join(' ') ||
      profiles.email ||
      'Unknown User'
    : null;
  const isActive = assignment.status === 'active';

  return (
    <Card
      padding={0}
      interactive
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden"
    >
      {(onDelete || onClone) && (
        <div
          className="absolute right-2 top-2 z-10 flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {onClone ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconButton
                  icon="Copy"
                  label="Clone program"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClone();
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Clone</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
          {onDelete ? (
            <DeleteConfirmationDialog
              title="Delete Program"
              description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
              onConfirm={handleDelete}
              trigger={
                <IconButton
                  icon="Trash2"
                  label="Delete program"
                  variant="ghost"
                  size="sm"
                  className="text-[var(--danger)] hover:bg-[var(--danger-soft)]"
                  onClick={(e) => e.stopPropagation()}
                />
              }
            />
          ) : null}
        </div>
      )}

      <div className="relative aspect-4/3 overflow-hidden bg-[var(--slate-50)]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            fill
            alt={template.name}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--slate-50)]">
            <span className="text-[var(--text-muted)]">No image</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col bg-[var(--surface-card)] p-5">
        <h3 className="mb-3 line-clamp-2 text-[length:var(--text-base)] font-[var(--fw-semibold)] leading-tight text-[var(--text-strong)]">
          {template.name}
        </h3>

        {template.description ? (
          <p className="mb-3 line-clamp-2 text-[length:var(--text-sm)] text-[var(--text-muted)]">
            {template.description}
          </p>
        ) : null}

        {isActive && userName && assignment.user_id ? (
          <div className="mb-3 text-[length:var(--text-sm)] text-[var(--text-muted)]">
            Assigned to:{' '}
            <Link
              href={`/users/${assignment.user_id}?from=/builder`}
              onClick={(e) => e.stopPropagation()}
              className="font-[var(--fw-medium)] text-[var(--primary)] hover:underline"
            >
              {userName}
            </Link>
          </div>
        ) : null}

        <div className="mt-auto space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              {template.weeks} {template.weeks === 1 ? 'week' : 'weeks'}
            </Badge>
            {template.goals ? (
              <Badge tone="neutral">{template.goals}</Badge>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
