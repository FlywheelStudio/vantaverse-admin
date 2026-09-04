function ReviewAssignSaveBarSkeleton(): React.ReactElement {
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
            width: index === 0 ? 120 : index === 1 ? 140 : 148,
            height: 32,
            background: 'var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            opacity: index === 2 ? 1 : 0.6,
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

/** Structure-matching placeholder for the review & assign route. */
export function ReviewAssignLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <header className="abar" aria-busy="true" aria-hidden>
        <nav className="ribbon">
          <span className="rib-l" style={{ opacity: 0.35 }}>Programs</span>
          <span className="rib-sep" aria-hidden />
          <span className="rib-l" style={{ opacity: 0.35 }}>…</span>
          <span className="rib-sep" aria-hidden />
          <span className="rib-cur" style={{ opacity: 0.35 }}>Review and assign</span>
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
        </div>
      </header>
      <div className="body" aria-busy="true">
        <ReviewAssignSaveBarSkeleton />
        <div
          className="g"
          style={{
            gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)',
            alignItems: 'start',
          }}
        >
          <div className="card card-flush" style={{ minHeight: 380 }}>
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: 200,
                  height: 16,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                }}
              />
            </div>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="row"
                style={{
                  gap: 12,
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ width: 28, height: 14, background: 'var(--border-subtle)', borderRadius: 4 }} />
                <div style={{ flex: 1, height: 14, background: 'var(--border-subtle)', borderRadius: 4 }} />
                <div style={{ width: 48, height: 14, background: 'var(--border-subtle)', borderRadius: 4 }} />
              </div>
            ))}
          </div>
          <div>
            <div className="card" style={{ marginBottom: 16, minHeight: 160, padding: 16 }} />
            <div className="card" style={{ minHeight: 220, padding: 16 }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="row"
                  style={{ gap: 11, marginBottom: index < 2 ? 12 : 0 }}
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
                        width: '60%',
                        height: 14,
                        background: 'var(--border-subtle)',
                        borderRadius: 4,
                        marginBottom: 6,
                      }}
                    />
                    <div
                      style={{
                        width: '40%',
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
        </div>
      </div>
    </>
  );
}
