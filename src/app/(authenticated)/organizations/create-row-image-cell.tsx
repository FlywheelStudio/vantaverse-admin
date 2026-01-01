'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { useOrganizationsTable } from './context';

export function CreateRowImageCell() {
  const { newOrgData, setNewOrgData, uploadingImage, creatingRow } =
    useOrganizationsTable();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isUploading = creatingRow && uploadingImage !== null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    // Store file and create preview
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

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
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
        onClick={handleClick}
        disabled={isUploading}
        className="relative flex size-8 shrink-0 overflow-visible rounded-full h-12 w-12 border-2 border-[#E5E9F0] bg-muted items-center justify-center hover:border-[#2454FF] hover:bg-[#2454FF]/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {newOrgData.imagePreview ? (
          <div className="relative w-full h-full bg-gray-200">
            <Image
              src={newOrgData.imagePreview}
              alt=""
              className="aspect-square size-full object-contain"
              width={48}
              height={48}
            />
          </div>
        ) : (
          <Upload className="h-5 w-5 text-[#64748B]" />
        )}
        {isUploading && (
          <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
            <div className="loader" style={{ width: '56px', height: '56px' }} />
          </div>
        )}
      </button>
    </>
  );
}
