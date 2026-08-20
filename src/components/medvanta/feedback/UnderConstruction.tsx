interface UnderConstructionProps {
  /** Tighter padding/logo size for use inside modals and inline sections. */
  compact?: boolean;
}

/** Placeholder for sections whose data isn't wired up yet. */
export function UnderConstruction({
  compact = false,
}: UnderConstructionProps): React.ReactElement {
  const logoWidth = compact ? 100 : 130;
  const logoHeight = compact ? 11 : 14;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 10 : 14,
        padding: compact ? '20px 16px' : '48px 16px',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- renders in Storybook, whose Vite preview can't resolve next/image's runtime deps */}
      <img
        src="/medvanta-text-blue.png"
        alt="MedVanta"
        width={logoWidth}
        height={logoHeight}
        style={{ opacity: 0.4 }}
      />
      <span
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--text-muted)',
        }}
      >
        Under construction
      </span>
    </div>
  );
}
