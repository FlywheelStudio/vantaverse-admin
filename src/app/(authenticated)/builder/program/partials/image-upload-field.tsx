'use client';

import { UseFormSetValue } from 'react-hook-form';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import type { ProgramTemplateFormData } from '../schemas';

interface ImageUploadFieldProps {
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  setValue: UseFormSetValue<ProgramTemplateFormData>;
}

export function ImageUploadField({
  imagePreview,
  setImagePreview,
  setValue,
}: ImageUploadFieldProps) {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setValue('imageFile', file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setImagePreview(preview);
      setValue('imagePreview', preview, { shouldDirty: true });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label
        htmlFor="image"
        className="block text-sm font-medium text-muted-foreground mb-1"
      >
        Image
      </label>
      <Input
        id="image"
        name="image"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />
      {imagePreview && (
        <div className="mt-2 relative w-full h-48 rounded-[var(--radius-lg)] overflow-hidden border border-border">
          <Image
            src={imagePreview}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      )}
    </div>
  );
}
