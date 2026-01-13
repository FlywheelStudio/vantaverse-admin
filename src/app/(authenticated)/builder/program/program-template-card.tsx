'use client';

import Image from 'next/image';
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

    if (
      typeof template.image_url === 'object' &&
      template.image_url !== null &&
      'url' in template.image_url
    ) {
      return String(template.image_url.url);
    }

    return null;
  };

  const imageUrl = getImageUrl();

  return (
    <Card
      onClick={onClick}
      className="h-full flex flex-col gap-0 group overflow-hidden rounded-2xl border-2 border-[#E5E9F0] hover:border-[#2454FF] hover:shadow-xl transition-all duration-300 cursor-pointer bg-white relative"
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
                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold cursor-pointer bg-white/90 backdrop-blur-sm shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      )}

      {/* Template Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-[#F5F7FA] to-[#E5E9F0]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={template.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#F5F7FA] to-[#E5E9F0]">
            <span className="text-[#64748B]">No image</span>
          </div>
        )}
      </div>

      {/* Template Info */}
      <CardContent className="flex-1 flex flex-col p-5 bg-linear-to-b from-[#A8E6E1]/30 to-[#D4EEF7]/20">
        <h3 className="font-bold text-[#1E3A5F] text-base mb-3 line-clamp-2 leading-tight">
          {template.name}
        </h3>

        {template.description && (
          <p className="text-sm text-[#64748B] mb-3 line-clamp-2">
            {template.description}
          </p>
        )}

        <div className="space-y-2 mt-auto">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="bg-[#D1FAE5] text-[#065F46] border-[#10B981]/30"
            >
              {template.weeks} {template.weeks === 1 ? 'week' : 'weeks'}
            </Badge>
            {template.goals && (
              <Badge
                variant="outline"
                className="bg-[#F5F7FA] text-[#64748B] border-[#E5E9F0]"
              >
                {template.goals}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
