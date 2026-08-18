'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { avatarTone } from '@/app/(authenticated)/dashboard/html-utils';

/**
 * Design-system avatar background from HTML `av-t1`…`av-t4` tones.
 * Gradients keep HSL variety for program cards only.
 */
export function generateColorFromSeed(
  seed: string | null | undefined,
  {
    gradient = false,
    style = 'default',
  }: { gradient?: boolean; style?: 'default' | 'program' } = {},
): string {
  if (gradient) {
    if (!seed) {
      return style === 'program'
        ? 'linear-gradient(160deg, hsl(210, 40%, 36%), hsl(190, 35%, 62%))'
        : 'linear-gradient(135deg, hsl(210, 40%, 42%), hsl(190, 30%, 58%))';
    }
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    if (style === 'program') {
      const angle = 160;
      const delta = 44 + (Math.abs(hash) % 36);
      const hue2 = (hue + delta) % 360;
      return `linear-gradient(${angle}deg, hsl(${hue}, 58%, 38%), hsl(${hue2}, 70%, 58%))`;
    }
    const delta = 26 + (Math.abs(hash) % 28);
    const hue2 = (hue + delta) % 360;
    return `linear-gradient(135deg, hsl(${hue}, 64%, 44%), hsl(${hue2}, 72%, 56%))`;
  }

  switch (avatarTone(seed || 'default')) {
    case 'av-t2':
      return 'var(--cyan-100)';
    case 'av-t3':
      return 'var(--slate-200)';
    case 'av-t4':
      return 'var(--navy-700)';
    case 'av-t1':
    default:
      return 'var(--navy-100)';
  }
}

function toneForeground(seed: string): string {
  switch (avatarTone(seed)) {
    case 'av-t2':
      return 'var(--cyan-800)';
    case 'av-t3':
      return 'var(--slate-700)';
    case 'av-t4':
      return 'var(--white)';
    case 'av-t1':
    default:
      return 'var(--navy-700)';
  }
}

/** Initials from name parts. */
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
}: AvatarProps): React.ReactElement {
  const displayName = `${firstName} ${lastName}`.trim() || userId || 'Member';
  const toneClass = avatarTone(displayName);
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
        'av w-full h-full',
        toneClass,
        !disableNavigation && 'cursor-pointer',
        className,
      )}
      style={{
        fontSize,
        background: generateColorFromSeed(displayName),
        color: toneForeground(displayName),
      }}
      onClick={
        disableNavigation ? undefined : () => router.push(`/users/${userId}`)
      }
    >
      {initials}
    </div>
  );
}
