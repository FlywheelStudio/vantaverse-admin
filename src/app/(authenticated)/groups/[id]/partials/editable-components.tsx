'use client';

import * as React from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Icon, Input, Textarea } from '@/components/medvanta';

export function EditableTitle({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (nextValue: string) => Promise<void> | void;
  className?: string;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) {
      wrapperRef.current?.querySelector('input')?.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={wrapperRef}>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={async () => {
            const next = draft.trim();
            setIsEditing(false);
            if (next && next !== value.trim()) await onSave(next);
            if (!next) setDraft(value);
          }}
          className={className}
        />
      </div>
    );
  }

  return (
    <h1
      onClick={() => setIsEditing(true)}
      className={className}
      title="Click to edit"
    >
      {value}
    </h1>
  );
}

export function EditableDescription({
  value,
  onSave,
  className,
  placeholder = '—',
}: {
  value: string;
  onSave: (nextValue: string | null) => Promise<void> | void;
  className?: string;
  placeholder?: string;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) {
      wrapperRef.current?.querySelector('textarea')?.focus();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div ref={wrapperRef}>
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={async () => {
            const next = draft.trim();
            setIsEditing(false);
            const normalized = next.length > 0 ? next : null;
            const currentNormalized =
              value.trim().length > 0 ? value.trim() : null;
            if (normalized !== currentNormalized) await onSave(normalized);
          }}
          rows={3}
          className={className}
        />
      </div>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={className}
      title="Click to edit"
    >
      {value.trim().length > 0 ? value : placeholder}
    </span>
  );
}

export function GroupImageUploader({
  pictureUrl,
  onUpload,
  isUploading: externalIsUploading,
}: {
  pictureUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [internalIsUploading, setInternalIsUploading] = React.useState(false);
  const isUploading = externalIsUploading ?? internalIsUploading;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    if (!externalIsUploading) {
      setInternalIsUploading(true);
    }
    try {
      await onUpload(file);
    } finally {
      if (!externalIsUploading) {
        setInternalIsUploading(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-pill)] border border-[var(--border-default)] bg-[var(--slate-50)] transition-colors hover:border-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!pictureUrl ? (
          <Icon name="Upload" size={20} className="text-[var(--primary)]" />
        ) : (
          <Image
            src={pictureUrl}
            alt=""
            className="aspect-square size-full object-contain"
            width={64}
            height={64}
            key={pictureUrl}
          />
        )}
        {isUploading ? (
          <div className="pointer-events-none absolute -inset-1 flex items-center justify-center">
            <div className="loader" style={{ width: '72px', height: '72px' }} />
          </div>
        ) : null}
      </button>
    </>
  );
}
