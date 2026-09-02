'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { Icon } from '@/components/medvanta';
import { useOrganizationsTable } from '@/context/organizations';

export function CreateRowImageCell() {
  const { newOrgData, setNewOrgData, uploadingImage, creatingRow } =
    useOrganizationsTable();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isUploading = creatingRow && uploadingImage !== null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setNewOrgData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: base64String,
      }));
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--slate-50)] transition-colors hover:border-[var(--border-focus)] hover:bg-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {newOrgData.imagePreview ? (
          <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-pill)]">
            <Image
              src={newOrgData.imagePreview}
              alt=""
              className="aspect-square size-full object-contain"
              width={48}
              height={48}
            />
          </div>
        ) : (
          <Icon name="Upload" size={20} className="text-[var(--text-muted)]" />
        )}
        {isUploading ? (
          <div className="pointer-events-none absolute -inset-1 flex items-center justify-center">
            <div className="loader" style={{ width: '56px', height: '56px' }} />
          </div>
        ) : null}
      </button>
    </>
  );
}
