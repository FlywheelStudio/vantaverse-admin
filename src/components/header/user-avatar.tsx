'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/use-profile';
import { useIsMobile } from '@/hooks/use-mobile';

// Generate a consistent color from a seed string
function generateColorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with good saturation and lightness for avatars
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

// Generate initials from name
function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  username: string | null | undefined,
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (username) {
    return username[0].toUpperCase();
  }
  return 'A';
}

interface UserAvatarProps {
  showName?: boolean;
}

export function UserAvatar({ showName = true }: UserAvatarProps) {
  const { data: profile, isLoading, error } = useProfile();
  const isMobile = useIsMobile();

  const userName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : profile?.username;

  const userAvatar = profile?.avatar_url;
  const initials = getInitials(
    profile?.first_name,
    profile?.last_name,
    profile?.username,
  );

  // Use email as seed if available, fallback to ID or username
  const colorSeed =
    profile?.email || profile?.id || profile?.username || 'default';
  const avatarColor = generateColorFromSeed(colorSeed);

  if (isLoading) {
    return (
      <motion.button
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] h-9 px-1.5 py-2 gap-2"
        aria-label="User menu"
        disabled
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <span className="relative flex size-9 shrink-0 overflow-visible rounded-full">
          <div className="flex items-center justify-center pointer-events-none">
            <div className="loader" style={{ width: '38px', height: '38px' }} />
          </div>
        </span>
      </motion.button>
    );
  }

  if (error) {
    return (
      <motion.button
        type="button"
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] h-9 px-4 py-2 gap-2"
        aria-label="User menu"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <motion.span
          className="relative flex size-9 shrink-0 overflow-hidden rounded-full"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="w-full h-full flex items-center justify-center text-white text-xs font-medium"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
        </motion.span>
        {showName && !isMobile && (
          <span className="text-sm font-medium">User</span>
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] h-9 px-1.5 py-2 gap-2"
      aria-label="User menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        className="relative flex size-9 shrink-0 overflow-visible rounded-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {userAvatar ? (
          <motion.div
            className="relative w-full h-full rounded-full bg-gray-200 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Image
              src={userAvatar}
              alt=""
              fill
              className="aspect-square size-full object-cover"
            />
          </motion.div>
        ) : (
          <motion.div
            className="w-full h-full flex items-center justify-center text-white text-xs font-medium rounded-full"
            style={{ backgroundColor: avatarColor }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {initials}
          </motion.div>
        )}
      </motion.span>
      {showName && !isMobile && (
        <motion.span
          className="text-sm font-medium text-white"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {userName}
        </motion.span>
      )}
    </motion.button>
  );
}
