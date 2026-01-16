'use client';

import * as React from 'react';
import Image from 'next/image';
import { Users, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/card';
import { EditableDescription } from './editable-components';
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64String = await base64Promise;

      const oldPictureUrl = organization.picture_url || null;

      const uploadResult = await uploadOrganizationPicture(
        organization.id,
        base64String,
        oldPictureUrl,
      );

      if (!uploadResult.success) {
        toast.error(uploadResult.error || 'Failed to upload image');
        return;
      }

      if (!uploadResult.data) {
        toast.error('Failed to upload image');
        return;
      }

      const updateResult = await updateOrganizationPicture(
        organization.id,
        uploadResult.data,
      );

      if (!updateResult.success) {
        toast.error(updateResult.error || 'Failed to save image');
        return;
      }

      onOrganizationChange({ picture_url: uploadResult.data });
      toast.success('Image uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleUpload(file);
  };

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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="relative flex size-16 overflow-hidden rounded-lg border-2 border-[#E5E9F0] hover:border-[#2454FF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 items-center justify-center"
          >
            {!organization.picture_url ? (
              <Upload className="h-6 w-6 text-[#64748B]" />
            ) : (
              <Image
                src={organization.picture_url}
                alt=""
                className="object-contain"
                fill
              />
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-white/80">
                <div
                  className="loader"
                  style={{ width: '48px', height: '48px' }}
                />
              </div>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
