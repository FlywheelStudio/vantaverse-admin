'use client';

import { Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { EditableDescription, GroupImageUploader } from './editable-components';
import {
  useUpdateOrganization,
  useUpdateOrganizationPicture,
} from '../hooks/use-group-mutations';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export function OrganizationInfoCard({
  organization,
  memberCount,
}: {
  organization: Pick<Organization, 'id' | 'description' | 'picture_url'>;
  memberCount: number;
}) {
  const updateOrganizationMutation = useUpdateOrganization(organization.id);
  const updatePictureMutation = useUpdateOrganizationPicture(organization.id);

  const handleSaveDescription = async (next: string | null) => {
    updateOrganizationMutation.mutate({ description: next });
  };

  const handleImageUpload = async (file: File) => {
    updatePictureMutation.mutate({ file });
  };

  return (
    <Card className="p-6 border border-border bg-card/95 h-full flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <EditableDescription
            value={organization.description || ''}
            onSave={handleSaveDescription}
            className="text-sm text-[#64748B] cursor-pointer hover:text-[#2454FF] transition-colors"
            placeholder="Click to add description"
          />
          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <Users className="h-4 w-4" />
            <span>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
        <div className="size-16 shrink-0 flex items-center justify-center">
          <GroupImageUploader
            pictureUrl={organization.picture_url}
            onUpload={handleImageUpload}
            isUploading={updatePictureMutation.isPending}
          />
        </div>
      </div>
    </Card>
  );
}
