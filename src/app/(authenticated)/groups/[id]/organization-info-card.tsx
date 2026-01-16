'use client';

import * as React from 'react';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { EditableDescription, GroupImageUploader } from './editable-components';
import {
  updateOrganization,
  uploadOrganizationPicture,
  updateOrganizationPicture,
} from '../actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export function OrganizationInfoCard({
  organization,
  memberCount,
  onOrganizationChange,
}: {
  organization: Pick<Organization, 'id' | 'description' | 'picture_url'>;
  memberCount: number;
  onOrganizationChange: (
    patch: Partial<Pick<Organization, 'description' | 'picture_url'>>,
  ) => void;
}) {
  const handleSaveDescription = async (next: string | null) => {
    const prev = organization.description;
    onOrganizationChange({ description: next });
    const result = await updateOrganization(organization.id, {
      description: next,
    });
    if (!result.success) {
      onOrganizationChange({ description: prev });
      toast.error(result.error || 'Failed to update description');
    }
  };

  const handleImageUpload = async (file: File) => {
    const prev = organization.picture_url;
    try {
      const reader = new FileReader();
      const base64String = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadResult = await uploadOrganizationPicture(
        organization.id,
        base64String,
        prev,
      );

      if (!uploadResult.success || !uploadResult.data) {
        const errorMessage =
          'error' in uploadResult && typeof uploadResult.error === 'string'
            ? uploadResult.error
            : 'Failed to upload image';
        toast.error(errorMessage);
        return;
      }

      const updateResult = await updateOrganizationPicture(
        organization.id,
        uploadResult.data,
      );

      if (!updateResult.success) {
        const errorMessage =
          'error' in updateResult
            ? updateResult.error
            : 'Failed to update image';
        toast.error(errorMessage);
        return;
      }

      onOrganizationChange({ picture_url: uploadResult.data });
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  return (
    <Card className="p-6 border border-white/50 bg-white/95 h-full flex flex-col">
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
          />
        </div>
      </div>
    </Card>
  );
}
