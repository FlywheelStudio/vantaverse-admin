interface AvatarUiProps {
  toneClass: string;
  initials: string;
  size: 24 | 28 | 32 | 36 | 44 | 56 | 72;
  title: string;
}

/** HTML `.av` monogram avatar. */
export function AvatarUi({
  toneClass,
  initials,
  size,
  title,
}: AvatarUiProps): React.ReactElement {
  return (
    <span className={`av av-${size} ${toneClass}`} title={title}>
      {initials}
    </span>
  );
}
