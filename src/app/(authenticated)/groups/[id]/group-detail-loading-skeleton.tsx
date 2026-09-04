/** Structure-matching placeholder for the group detail route. */
export function GroupDetailLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <header className="abar" aria-busy="true" aria-hidden>
        <nav className="ribbon">
          <span className="rib-l" style={{ opacity: 0.35 }}>Groups</span>
          <span className="rib-sep" aria-hidden />
          <span className="rib-cur" style={{ opacity: 0.35 }}>…</span>
        </nav>
        <div className="abar-row">
          <div className="abar-id">
            <h1 style={{ opacity: 0.35 }}>Group</h1>
          </div>
        </div>
      </header>
      <div className="body" aria-busy="true">
        <div className="card" style={{ marginBottom: 16, padding: 22, minHeight: 120 }}>
          <div className="row" style={{ gap: 18, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--border-subtle)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: '45%',
                  height: 18,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                  marginBottom: 10,
                }}
              />
              <div
                style={{
                  width: '70%',
                  height: 12,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        </div>

        <div className="tabs" style={{ marginBottom: 18 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              style={{
                width: 96,
                height: 34,
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                opacity: index === 0 ? 1 : 0.55,
              }}
            />
          ))}
        </div>

        <div className="card card-flush" style={{ minHeight: 360 }}>
          {Array.from({ length: 6 }).map((_, index) => (
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
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--border-subtle)',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: `${50 + (index % 2) * 15}%`,
                    height: 14,
                    background: 'var(--border-subtle)',
                    borderRadius: 4,
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
