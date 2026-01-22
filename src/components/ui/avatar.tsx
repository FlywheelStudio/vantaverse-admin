'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Generate a consistent color from a seed string
export function generateColorFromSeed(seed: string | null | undefined): string {
  if (!seed) {
    // Fallback color for undefined/null seeds
    return 'hsl(0, 0%, 50%)';
  }
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
): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  return '??';
}

interface AvatarProps {
  firstName: string;
  lastName: string;
  src?: string | null;
  userId: string;
  size?: number;
  className?: string;
}

export function Avatar({
  src,
  firstName,
  lastName,
  userId,
  size = 36,
  className = '',
}: AvatarProps) {
  const colorSeed = userId || 'default';
  const avatarColor = generateColorFromSeed(colorSeed);
  const fontSize = size * 0.35;
  const initials = getInitials(firstName, lastName);
  const router = useRouter();

  return src ? (
    <div
      onClick={() => router.push(`/users/${userId}`)}
      className={`relative w-full h-full bg-gray-200 cursor-pointer overflow-hidden rounded-full ${className}`}
    >
      <Image
        src={src}
        alt={`${firstName} ${lastName}`}
        fill
        className="aspect-square size-full object-cover"
      />
    </div>
  ) : (
    <div
      className={`w-full h-full flex items-center justify-center text-white text-xs font-medium cursor-pointer rounded-full ${className}`}
      style={{ backgroundColor: avatarColor, fontSize }}
    >
      {initials}
    </div>
  );
}
