function ConversationListSkeleton(): React.ReactElement {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="row"
          style={{
            gap: 10,
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--border-subtle)',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="row"
              style={{ gap: 8, marginBottom: 6 }}
            >
              <div
                style={{
                  width: `${45 + (index % 3) * 10}%`,
                  height: 14,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                }}
              />
              <span className="sp" />
              <div
                style={{
                  width: 36,
                  height: 12,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                  opacity: 0.7,
                }}
              />
            </div>
            <div
              style={{
                width: '35%',
                height: 10,
                background: 'var(--border-subtle)',
                borderRadius: 4,
                marginBottom: 6,
                opacity: 0.6,
              }}
            />
            <div
              style={{
                width: '80%',
                height: 12,
                background: 'var(--border-subtle)',
                borderRadius: 4,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

/** Structure-matching placeholder for the messages split-pane layout. */
export function MessagesLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <header className="abar" aria-busy="true" aria-hidden>
        <nav className="ribbon">
          <span className="rib-cur" style={{ opacity: 0.35 }}>Messages</span>
        </nav>
        <div className="abar-row">
          <div className="abar-id">
            <h1 style={{ opacity: 0.35 }}>Messages</h1>
            <div
              className="abar-sub"
              style={{
                width: 180,
                height: 12,
                background: 'var(--border-subtle)',
                borderRadius: 4,
              }}
            />
          </div>
          <div className="abar-acts">
            <div
              style={{
                width: 128,
                height: 36,
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                marginRight: 8,
              }}
            />
            <div
              style={{
                width: 36,
                height: 36,
                background: 'var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
              }}
            />
          </div>
        </div>
      </header>
      <div className="body-flush" aria-busy="true">
        <div className="msg-wrap">
          <div className="conv-list">
            <div className="conv-hd">
              <div className="row" style={{ gap: 7 }}>
                <div
                  style={{
                    flex: 1,
                    height: 34,
                    background: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <div
                  style={{
                    width: 38,
                    height: 34,
                    background: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>
              <span className="seg" style={{ width: '100%' }}>
                <div
                  style={{
                    flex: 1,
                    height: 30,
                    background: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    flex: 1,
                    height: 30,
                    background: 'var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </span>
            </div>
            <div className="conv-scroll">
              <ConversationListSkeleton />
            </div>
          </div>
          <div className="thread">
            <div className="empty" style={{ flex: 1 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--border-subtle)',
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  width: 160,
                  height: 16,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  width: 220,
                  height: 12,
                  background: 'var(--border-subtle)',
                  borderRadius: 4,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
