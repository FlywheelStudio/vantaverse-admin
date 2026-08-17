export interface PlaceholderBlockProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

/** Card shell for sections where real data is not yet wired. */
export function PlaceholderBlock({
  title,
  className,
  children,
}: PlaceholderBlockProps): React.ReactElement {
  return (
    <div className={className ?? 'card'}>
      <div className="ch">
        <div>
          <div className="ch-t">{title}</div>
          <div className="ch-s">Placeholder — data not available</div>
        </div>
      </div>
      {children}
    </div>
  );
}
