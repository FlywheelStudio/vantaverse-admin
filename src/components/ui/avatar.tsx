'use client';

import Image from 'next/image';

// Generate a consistent color from a seed string
export function generateColorFromSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with good saturation and lightness for avatars
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

// Generate initials from name parts
export function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  username: string | null | undefined,
  label?: string,
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
  if (label) {
    const parts = label.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return label[0].toUpperCase();
  }
  return 'A';
}

interface AvatarProps {
  src?: string | null;
  alt?: string;
  initials?: string;
  colorSeed?: string;
  size?: number;
  className?: string;
}

export function Avatar({
  src,
  alt = '',
  initials,
  colorSeed = 'default',
  size = 36,
  className = '',
}: AvatarProps) {
  const avatarColor = generateColorFromSeed(colorSeed);
  const fontSize = size * 0.35;

  return src ? (
    <div
      className={`relative w-full h-full rounded-full bg-gray-200 overflow-hidden ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="aspect-square size-full object-cover"
      />
    </div>
  ) : (
    <div
      className={`w-full h-full flex items-center justify-center text-white text-xs font-medium rounded-full ${className}`}
      style={{ backgroundColor: avatarColor, fontSize }}
    >
      {initials}
    </div>
  );
}
