'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Generate a consistent color from a seed string
export function generateColorFromSeed(
  seed: string | null | undefined,
  {
    gradient = false,
    style = 'default',
  }: { gradient?: boolean; style?: 'default' | 'program' } = {},
): string {
  if (!seed) {
    // Fallback color for undefined/null seeds
    return gradient
      ? style === 'program'
        ? 'linear-gradient(160deg, hsl(0, 0%, 36%), hsl(0, 0%, 62%))'
        : 'linear-gradient(135deg, hsl(0, 0%, 42%), hsl(0, 0%, 58%))'
      : 'hsl(0, 0%, 50%)';
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate HSL color with good saturation and lightness for avatars
  const hue = Math.abs(hash) % 360;
  if (!gradient) return `hsl(${hue}, 65%, 50%)`;

  if (style === 'program') {
    const angle = 160;
    const delta = 44 + (Math.abs(hash) % 36); // 44..79
    const hue2 = (hue + delta) % 360;
    const sat1 = 58;
    const sat2 = 70;
    const light1 = 38;
    const light2 = 58;
    return `linear-gradient(${angle}deg, hsl(${hue}, ${sat1}%, ${light1}%), hsl(${hue2}, ${sat2}%, ${light2}%))`;
  }

  const delta = 26 + (Math.abs(hash) % 28); // 26..53
  const hue2 = (hue + delta) % 360;
  const sat1 = 64;
  const sat2 = 72;
  const light1 = 44;
  const light2 = 56;

  return `linear-gradient(135deg, hsl(${hue}, ${sat1}%, ${light1}%), hsl(${hue2}, ${sat2}%, ${light2}%))`;
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
  /** When true, clicking the avatar does not navigate to user profile */
  disableNavigation?: boolean;
}

export function Avatar({
  src,
  firstName,
  lastName,
  userId,
  size = 36,
  className = '',
  disableNavigation = false,
}: AvatarProps) {
  const colorSeed = userId || 'default';
  const avatarColor = generateColorFromSeed(colorSeed);
  const fontSize = size * 0.35;
  const initials = getInitials(firstName, lastName);
  const router = useRouter();

  return src ? (
    <div
      onClick={
        disableNavigation ? undefined : () => router.push(`/users/${userId}`)
      }
      className={cn(
        'relative w-full h-full overflow-hidden rounded-full',
        !disableNavigation && 'cursor-pointer',
        'bg-muted ring-1 ring-border/40',
        className,
      )}
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
      className={cn(
        'w-full h-full flex items-center justify-center rounded-full',
        !disableNavigation && 'cursor-pointer',
        'text-white text-xs font-medium ring-1 ring-border/40',
        className,
      )}
      style={{ backgroundColor: avatarColor, fontSize }}
    >
      {initials}
    </div>
  );
}
