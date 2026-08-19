import { avatarTone, initialsFromName } from '@/components/widgets/utils';

interface HtmlAvatarProps {
  name: string;
  size?: 24 | 28 | 32 | 36 | 44 | 56 | 72;
  title?: string;
}

/** HTML `.av` monogram avatar. */
export function HtmlAvatar({
  name,
  size = 36,
  title,
}: HtmlAvatarProps): React.ReactElement {
  return (
    <span
      className={`av av-${size} ${avatarTone(name)}`}
      title={title ?? name}
    >
      {initialsFromName(name)}
    </span>
  );
}
