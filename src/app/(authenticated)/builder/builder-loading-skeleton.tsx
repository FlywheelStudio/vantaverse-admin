/** Structure-matching placeholder for the programs list route. */
export function BuilderLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <header className="abar" aria-busy="true" aria-hidden>
        <nav className="ribbon">
          <span className="rib-cur" style={{ opacity: 0.35 }}>Programs</span>
        </nav>
        <div className="abar-row">
          <div className="abar-id">
            <h1 style={{ opacity: 0.35 }}>Programs</h1>
            <div
              className="abar-sub"
              style={{
                width: 260,
                height: 12,
                background: 'var(--border-subtle)',
                borderRadius: 4,
              }}
            />
          </div>
          <div className="abar-acts">
            <div
              style={{
                width: 132,
                height: 36,
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
        </div>
      </header>
      <div className="body" aria-busy="true">
        <div className="card" style={{ marginBottom: 16, minHeight: 88 }} />
        <div className="card card-flush" style={{ minHeight: 480 }}>
          <div
            className="row"
            style={{
              gap: 8,
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                flex: 1,
                height: 36,
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="row"
              style={{
                gap: 12,
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--border-subtle)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: `${48 + (index % 3) * 10}%`,
                    height: 14,
                    background: 'var(--border-subtle)',
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    width: '32%',
                    height: 12,
                    background: 'var(--border-subtle)',
                    borderRadius: 4,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
