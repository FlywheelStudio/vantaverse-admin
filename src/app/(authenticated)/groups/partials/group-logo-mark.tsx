'use client';

import Image from 'next/image';
import { avatarTone } from '@/components/widgets/utils';

function groupInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface GroupLogoMarkProps {
  name: string;
  pictureUrl: string | null | undefined;
  size: number;
}

/**
 * Shared group mark used in the /groups table, AppBar, and group hero.
 */
export function GroupLogoMark({
  name,
  pictureUrl,
  size,
}: GroupLogoMarkProps): React.ReactElement {
  const isDataUrl = pictureUrl?.startsWith('data:') === true;

  return (
    <span
      className="thmb gr"
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        flex: '0 0 auto',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {pictureUrl ? (
        <Image
          key={pictureUrl}
          src={pictureUrl}
          alt=""
          width={size}
          height={size}
          unoptimized={isDataUrl}
          className="size-full object-cover"
        />
      ) : (
        <span
          className={`av ${avatarTone(name)}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: Math.max(11, Math.round(size * 0.32)),
            fontWeight: 'var(--fw-bold)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          {groupInitials(name)}
        </span>
      )}
    </span>
  );
}
