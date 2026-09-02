/** Loading fallback mirroring the dashboard layout so tiles don't jump. */
export function DashboardSkeleton(): React.ReactElement {
  return (
    <div className="body" aria-busy="true">
      <div className="g g4" style={{ marginBottom: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card" style={{ minHeight: 140 }} />
        ))}
      </div>
      <div
        className="g"
        style={{
          gridTemplateColumns: 'minmax(0,1.65fr) minmax(0,1fr)',
          marginBottom: 16,
        }}
      >
        <div className="card card-flush" style={{ minHeight: 430 }} />
        <div className="card" style={{ minHeight: 430 }} />
      </div>
      <div
        className="g"
        style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}
      >
        <div className="card" style={{ minHeight: 180 }} />
        <div className="card" style={{ minHeight: 180 }} />
      </div>
    </div>
  );
}
