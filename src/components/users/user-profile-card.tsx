'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Badge, Icon, Input } from '@/components/medvanta';
import { updateUserProfile, uploadUserAvatar } from '@/app/(authenticated)/users/actions';
import toast from 'react-hot-toast';
import { MemberRole } from '@/lib/supabase/schemas/organization-members';

interface UserProfileCardProps {
  userId: string;
  firstName: string;
  lastName: string;
  description?: string | null;
  email: string;
  avatarUrl?: string | null;
  role?: MemberRole;
  programDueDate?: string | null;
}

export function UserProfileCard({
  userId,
  firstName: initialFirstName,
  lastName: initialLastName,
  description: initialDescription,
  email,
  avatarUrl: initialAvatarUrl,
  role = 'patient',
  programDueDate,
}: UserProfileCardProps): React.ReactElement {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [editingField, setEditingField] = useState<
    'firstName' | 'lastName' | 'description' | null
  >(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = `${firstName || 'Unknown'} ${lastName || 'User'}`.trim();
  const isOverdue =
    programDueDate != null && new Date(programDueDate) < new Date();

  const handleAvatarClick = (): void => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        if (!base64String) {
          setIsUploading(false);
          toast.error('Failed to read file.');
          return;
        }

        const result = await uploadUserAvatar(userId, base64String);

        if (result.success) {
          setAvatarUrl(result.data);
          toast.success('Profile picture updated successfully');
        } else {
          toast.error(result.error);
        }

        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        setIsUploading(false);
        toast.error('Failed to read file.');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      toast.error('An unexpected error occurred during upload.');
    }
  };

  const getRoleTone = (
    memberRole: string,
  ): 'neutral' | 'brand' | 'danger' => {
    switch (memberRole.toLowerCase()) {
      case 'admin':
      case 'super_admin':
        return 'danger';
      default:
        return 'brand';
    }
  };

  const getDisplayRole = (memberRole: MemberRole | undefined): string => {
    if (!memberRole) return 'member';
    switch (memberRole) {
      case 'patient':
        return 'member';
      case 'admin':
        return 'admin';
      default:
        return memberRole;
    }
  };

  const fieldValueMap = {
    firstName,
    lastName,
    description,
  } as const;

  const fieldKeyMap = {
    firstName: 'first_name',
    lastName: 'last_name',
    description: 'description',
  } as const;

  const fieldSuccessMessages = {
    firstName: 'First name updated',
    lastName: 'Last name updated',
    description: 'Description updated',
  } as const;

  const handleFieldEdit = (
    field: 'firstName' | 'lastName' | 'description',
  ): void => {
    setEditingField(field);
    setEditingValue(fieldValueMap[field]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFieldBlur = async (
    field: 'firstName' | 'lastName' | 'description',
  ): Promise<void> => {
    const currentValue = fieldValueMap[field];
    if (editingValue === currentValue) {
      setEditingField(null);
      return;
    }

    let valueToSave = editingValue.trim();
    if (!valueToSave) {
      if (field === 'firstName') valueToSave = 'Unknown';
      else if (field === 'lastName') valueToSave = 'User';
    }

    const result = await updateUserProfile(userId, {
      [fieldKeyMap[field]]: valueToSave,
    });

    if (result.success) {
      if (field === 'firstName') setFirstName(valueToSave);
      else if (field === 'lastName') setLastName(valueToSave);
      else setDescription(valueToSave);
      toast.success(fieldSuccessMessages[field]);
    } else {
      toast.error(result.error);
      setEditingValue(currentValue);
    }
    setEditingField(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        hidden
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div className="flex items-center gap-6">
        <div
          className={`group relative size-24 shrink-0 ${
            isUploading ? 'cursor-wait opacity-50' : 'cursor-pointer'
          }`}
          onClick={handleAvatarClick}
          onMouseEnter={() => !isUploading && setIsHoveringAvatar(true)}
          onMouseLeave={() => setIsHoveringAvatar(false)}
        >
          <div className="h-full w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-card)] shadow-[var(--shadow-lg)] ring-4 ring-[color-mix(in_oklch,var(--primary)_20%,transparent)] transition-all duration-300 group-hover:scale-105 group-hover:ring-[color-mix(in_oklch,var(--primary)_40%,transparent)]">
            <Avatar
              src={avatarUrl || undefined}
              name={displayName}
              size="lg"
              className="h-full w-full [&>span:first-child]:h-full [&>span:first-child]:w-full [&>span:first-child]:text-[length:var(--text-xl)]"
            />
          </div>
          <AnimatePresence>
            {isUploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex size-24 items-center justify-center rounded-[var(--radius-pill)] bg-[color-mix(in_oklch,var(--navy-950)_70%,transparent)] backdrop-blur-sm"
              >
                <div className="flex flex-col items-center justify-center">
                  <Icon
                    name="LoaderCircle"
                    size={24}
                    className="animate-spin text-[var(--white)]"
                  />
                  <p className="mt-2 text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--white)]">
                    Uploading...
                  </p>
                </div>
              </motion.div>
            ) : isHoveringAvatar ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex size-24 items-center justify-center rounded-[var(--radius-pill)] bg-[color-mix(in_oklch,var(--navy-950)_70%,transparent)] backdrop-blur-sm"
              >
                <div className="flex flex-col items-center justify-center">
                  <Icon name="Camera" size={40} className="mb-2 text-[var(--white)]" />
                  <p className="text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--white)]">
                    Upload Photo
                  </p>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {editingField === 'firstName' ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('firstName')}
                className="max-w-32"
              />
            ) : (
              <button
                type="button"
                onClick={() => handleFieldEdit('firstName')}
                className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-2xl)] font-[var(--fw-bold)] text-[var(--text-strong)] hover:text-[var(--primary)]"
              >
                {firstName || 'Unknown'}
              </button>
            )}
            {editingField === 'lastName' ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('lastName')}
                className="max-w-32"
              />
            ) : (
              <button
                type="button"
                onClick={() => handleFieldEdit('lastName')}
                className="cursor-pointer border-0 bg-transparent p-0 text-[length:var(--text-2xl)] font-[var(--fw-bold)] text-[var(--text-strong)] hover:text-[var(--primary)]"
              >
                {lastName || 'User'}
              </button>
            )}
            <Badge tone={getRoleTone(role)}>{getDisplayRole(role)}</Badge>
            {programDueDate ? (
              <Badge tone={isOverdue ? 'danger' : 'warning'}>
                {isOverdue ? 'Overdue' : 'Due'}
              </Badge>
            ) : null}
          </div>
          <p className="mb-3 cursor-default text-[length:var(--text-sm)] text-[var(--text-muted)]">
            {email}
          </p>
          <div className="text-[length:var(--text-sm)]">
            {editingField === 'description' ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('description')}
                className="max-w-xl"
                placeholder="Add a description"
              />
            ) : (
              <button
                type="button"
                onClick={() => handleFieldEdit('description')}
                className="cursor-pointer border-0 bg-transparent p-0 text-[var(--text-muted)] hover:text-[var(--primary)]"
              >
                {description?.trim() ? description : 'Add a description'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
