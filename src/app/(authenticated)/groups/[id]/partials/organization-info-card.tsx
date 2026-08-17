'use client';

import { Card, Icon } from '@/components/medvanta';
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

  const handleSaveDescription = async (next: string | null): Promise<void> => {
    updateOrganizationMutation.mutate({ description: next });
  };

  const handleImageUpload = async (file: File): Promise<void> => {
    updatePictureMutation.mutate({ file });
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-1 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <EditableDescription
            value={organization.description || ''}
            onSave={handleSaveDescription}
            className="cursor-pointer text-[length:var(--text-sm)] text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
            placeholder="Click to add description"
          />
          <div className="flex items-center gap-2 text-[length:var(--text-sm)] text-[var(--text-muted)]">
            <Icon name="Users" size={16} />
            <span>
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
        <div className="flex size-16 shrink-0 items-center justify-center">
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
