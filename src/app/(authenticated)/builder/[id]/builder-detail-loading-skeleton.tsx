function BuilderSaveBarSkeleton(): React.ReactElement {
  return (
    <div
      className="card"
      style={{
        marginBottom: 16,
        padding: '10px 14px',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          style={{
            width: index === 0 ? 120 : index === 1 ? 140 : 128,
            height: 32,
            background: 'var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            opacity: index === 0 ? 1 : 0.6,
          }}
        />
      ))}
      <span className="sp" />
      <div
        style={{
          width: 72,
          height: 32,
          background: 'var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
    </div>
  );
}

/** Structure-matching placeholder for the program builder detail route. */
export function BuilderDetailLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <header className="abar" aria-busy="true" aria-hidden>
        <nav className="ribbon">
          <span className="rib-l" style={{ opacity: 0.35 }}>Programs</span>
          <span className="rib-sep" aria-hidden />
          <span className="rib-cur" style={{ opacity: 0.35 }}>…</span>
        </nav>
        <div className="abar-row">
          <div className="abar-id">
            <h1 style={{ opacity: 0.35 }}>Program</h1>
            <div
              className="abar-sub"
              style={{
                width: 160,
                height: 12,
                background: 'var(--border-subtle)',
                borderRadius: 4,
              }}
            />
          </div>
          <div className="abar-acts">
            <div
              style={{
                width: 148,
                height: 36,
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
        </div>
      </header>
      <div className="body" aria-busy="true">
        <BuilderSaveBarSkeleton />
        <div className="card" style={{ marginBottom: 16, minHeight: 420 }}>
          <div
            style={{
              padding: '16px 18px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: 140,
                height: 16,
                background: 'var(--border-subtle)',
                borderRadius: 4,
              }}
            />
          </div>
          <div style={{ padding: '18px 18px 0' }}>
            <div
              className="g"
              style={{
                gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ height: 56, background: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)' }} />
              <div style={{ height: 56, background: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div style={{ height: 56, background: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 16 }} />
            <div style={{ height: 120, background: 'var(--border-subtle)', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>
      </div>
    </>
  );
}
