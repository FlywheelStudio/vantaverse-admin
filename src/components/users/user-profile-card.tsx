'use client';

import * as React from 'react';
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
}

export function UserProfileCard({
  userId,
  firstName: initialFirstName,
  lastName: initialLastName,
  description: initialDescription,
  email,
  avatarUrl: initialAvatarUrl,
  role = 'patient',
}: UserProfileCardProps) {
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Inline editing state
  const [editingField, setEditingField] = useState<
    'firstName' | 'lastName' | 'description' | null
  >(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG and PNG images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        if (!base64String) {
          setIsUploading(false);
          toast.error('Failed to read file.');
          return;
        }

        // Upload to server
        const result = await uploadUserAvatar(userId, base64String);

        if (result.success) {
          setAvatarUrl(result.data);
          toast.success('Profile picture updated successfully');
        } else {
          toast.error(result.error);
        }

        setIsUploading(false);
        // Reset file input
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

  const handleFieldEdit = (field: 'firstName' | 'lastName' | 'description') => {
    setEditingField(field);
    setEditingValue(fieldValueMap[field]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleFieldBlur = async (
    field: 'firstName' | 'lastName' | 'description',
  ) => {
    const currentValue = fieldValueMap[field];
    if (editingValue === currentValue) {
      setEditingField(null);
      return;
    }

    // Set default values if empty
    let valueToSave = editingValue.trim();
    if (!valueToSave) {
      if (field === 'firstName') {
        valueToSave = 'Unknown';
      } else if (field === 'lastName') {
        valueToSave = 'User';
      }
    }

    const result = await updateUserProfile(userId, {
      [fieldKeyMap[field]]: valueToSave,
    });

    if (result.success) {
      if (field === 'firstName') {
        setFirstName(valueToSave);
      } else if (field === 'lastName') {
        setLastName(valueToSave);
      } else {
        setDescription(valueToSave);
      }
      toast.success(fieldSuccessMessages[field]);
    } else {
      toast.error(result.error);
      setEditingValue(currentValue);
    }
    setEditingField(null);
  };

  const handleFieldCancel = () => {
    const currentValue =
      editingField ? fieldValueMap[editingField] : '';
    setEditingValue(currentValue);
    setEditingField(null);
  };

  return (
    <>
      {/* Main Profile Card */}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        hidden
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Header Section with Horizontal Layout */}
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div
          className={`relative group shrink-0 size-24 ${
            isUploading ? 'cursor-wait opacity-50' : 'cursor-pointer'
          }`}
          onClick={handleAvatarClick}
          onMouseEnter={() => !isUploading && setIsHoveringAvatar(true)}
          onMouseLeave={() => setIsHoveringAvatar(false)}
        >
          <div className="w-full h-full rounded-full overflow-hidden shadow-2xl ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40 group-hover:scale-105 bg-white dark:bg-gray-800">
            <Avatar
              src={avatarUrl}
              firstName={firstName}
              lastName={lastName}
              userId={userId}
              size={88}
            />
          </div>
          {/* Upload Overlay */}
          <AnimatePresence>
            {isUploading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm z-10 size-24"
              >
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                  <p className="text-sm text-white font-semibold mt-2">
                    Uploading...
                  </p>
                </div>
              </motion.div>
            ) : isHoveringAvatar ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center backdrop-blur-sm z-10 size-24"
              >
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col items-center justify-center"
                  >
                    <Camera className="w-10 h-10 text-white mb-2" />
                    <p className="text-sm text-white font-semibold">
                      Upload Photo
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {/* User Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {editingField === 'firstName' ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('firstName')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleFieldCancel();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('firstName');
                  }
                }}
                className="w-auto max-w-32 text-2xl font-bold h-auto py-1 px-2 border-2"
                placeholder="First Name"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleFieldEdit('firstName')}
                className="text-2xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text cursor-pointer hover:text-[#2454FF] transition-colors"
              >
                {firstName || 'Unknown'}
              </span>
            )}
            {editingField === 'lastName' ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('lastName')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleFieldCancel();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('lastName');
                  }
                }}
                className="w-auto max-w-32 text-2xl font-bold h-auto py-1 px-2 border-2"
                placeholder="Last Name"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleFieldEdit('lastName')}
                className="text-2xl font-bold bg-linear-to-r from-foreground to-foreground/70 bg-clip-text cursor-pointer hover:text-[#2454FF] transition-colors"
              >
                {lastName || 'User'}
              </span>
            )}
          </div>
          <p className="text-muted-foreground mb-3 text-sm cursor-default">
            {email}
          </p>
          <div className="text-sm">
            {editingField === 'description' ? (
              <Input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={() => handleFieldBlur('description')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleFieldCancel();
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFieldBlur('description');
                  }
                }}
                className="w-full max-w-xl"
                placeholder="Add a description"
                autoFocus
              />
            ) : (
              <span
                onClick={() => handleFieldEdit('description')}
                className="text-muted-foreground cursor-pointer hover:text-[#2454FF] transition-colors"
              >
                {description?.trim() ? description : 'Add a description'}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
