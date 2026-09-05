import { cn } from '../utils/cn';
import Image from 'next/image';

const sizeDims = { sm: 28, md: 36, lg: 44 } as const;

const statusColors = {
  online: 'var(--success)',
  away: 'var(--warning)',
  offline: 'var(--slate-400)',
} as const;

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'online' | 'away' | 'offline';
  className?: string;
  style?: React.CSSProperties;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** User/org monogram or image with optional status dot. */
export function Avatar({
  name = '',
  src,
  size = 'md',
  status,
  className,
  style,
}: AvatarProps): React.ReactElement {
  const dimension = sizeDims[size];
  const initials = getInitials(name);
  const statusColor = status ? statusColors[status] : undefined;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--navy-100)] font-[var(--fw-bold)] text-[var(--navy-700)]',
        className,
      )}
      style={{
        width: dimension,
        height: dimension,
        fontSize: dimension * 0.38,
        ...style,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={dimension}
          height={dimension}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
      {statusColor ? (
        <span
          className="absolute rounded-full border-2 border-[var(--surface-card)]"
          style={{
            right: -1,
            bottom: -1,
            width: dimension * 0.28,
            height: dimension * 0.28,
            background: statusColor,
          }}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
