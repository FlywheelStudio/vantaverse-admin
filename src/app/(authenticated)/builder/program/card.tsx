'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface ProgramTemplateCardProps {
  assignment: ProgramAssignmentWithTemplate;
  onClick: () => void;
  onDelete?: () => void;
}

export function ProgramTemplateCard({
  assignment,
  onClick,
  onDelete,
}: ProgramTemplateCardProps) {
  const template = assignment.program_template;

  if (!template) {
    return null;
  }

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  const getImageUrl = (): string | null => {
    if (!template.image_url) {
      return null;
    }

    // Handle image_url as Json - could be string or object
    if (typeof template.image_url === 'string') {
      return template.image_url;
    }

    // Database constraint requires: { image_url: string, blur_hash: string }
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

  // Extract user info for active assignments
  const profiles = assignment.profiles as
    | {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
      }
    | null
    | undefined;
  const userName = profiles
    ? [
        profiles.first_name,
        profiles.last_name,
      ]
        .filter(Boolean)
        .join(' ') || profiles.email || 'Unknown User'
    : null;
  const isActive = assignment.status === 'active';

  return (
    <Card
      onClick={onClick}
      className="h-full flex flex-col gap-0 group overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-[var(--shadow-lg)] transition-all duration-300 cursor-pointer relative"
    >
      {/* Delete Button */}
      {onDelete && (
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DeleteConfirmationDialog
            title="Delete Program"
            description={`Are you sure you want to delete "${template.name}"? This action cannot be undone.`}
            onConfirm={handleDelete}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 font-semibold cursor-pointer bg-background/80 backdrop-blur-sm shadow-[var(--shadow-sm)]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      )}

      {/* Template Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-gradient-to-br from-muted to-background">
        {imageUrl ? (
          <Image
            src={imageUrl}
            fill
            alt={template.name}
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-background">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>

      {/* Template Info */}
      <CardContent className="flex-1 flex flex-col p-5 bg-gradient-to-b from-muted/40 to-background">
        <h3 className="font-semibold text-foreground text-base mb-3 line-clamp-2 leading-tight">
          {template.name}
        </h3>

        {template.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        {isActive && userName && assignment.user_id && (
          <div className="text-sm text-muted-foreground mb-3">
            Assigned to:{' '}
            <Link
              href={`/users/${assignment.user_id}?from=/builder`}
              onClick={(e) => e.stopPropagation()}
              className="text-primary hover:underline font-medium"
            >
              {userName}
            </Link>
          </div>
        )}

        <div className="space-y-2 mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">
              {template.weeks} {template.weeks === 1 ? 'week' : 'weeks'}
            </Badge>
            {template.goals && (
              <Badge variant="outline" className="text-muted-foreground">
                {template.goals}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
