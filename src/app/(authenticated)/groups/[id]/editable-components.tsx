'use client';

import * as React from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={async () => {
          const next = draft.trim();
          setIsEditing(false);
          if (next && next !== value.trim()) await onSave(next);
          if (!next) setDraft(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            setIsEditing(false);
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        className={className}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className={className}
      title="Click to edit"
    >
      {value}
    </span>
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
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  React.useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  if (isEditing) {
    return (
      <Textarea
        ref={inputRef}
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
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            setIsEditing(false);
          }
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            inputRef.current?.blur();
          }
        }}
        className={className}
      />
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
}: {
  pictureUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
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
        className="relative flex size-8 shrink-0 overflow-hidden rounded-full h-16 w-16 border-2 border-white/50 bg-white/20 items-center justify-center hover:bg-white/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {!pictureUrl ? (
          <Upload className="h-5 w-5 text-white/90" />
        ) : (
          <Image
            src={pictureUrl}
            alt=""
            className="aspect-square size-full object-contain bg-white/80"
            width={64}
            height={64}
          />
        )}
        {isUploading && (
          <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
            <div className="loader" style={{ width: '72px', height: '72px' }} />
          </div>
        )}
      </button>
    </>
  );
}
