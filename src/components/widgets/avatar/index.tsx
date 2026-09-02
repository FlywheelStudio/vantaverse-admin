import { avatarTone, initialsFromName } from '../utils';
import { AvatarUi } from './ui';

export function Avatar({
  name,
  size = 36,
  title,
}: {
  name: string;
  size?: 24 | 28 | 32 | 36 | 44 | 56 | 72;
  title?: string;
}): React.ReactElement {
  return (
    <AvatarUi
      toneClass={avatarTone(name)}
      initials={initialsFromName(name)}
      size={size}
      title={title ?? name}
    />
  );
}
