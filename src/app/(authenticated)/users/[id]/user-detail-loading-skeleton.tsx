import { AppBar } from '@/components/medvanta/shell';

/** Member detail loading shell: crumb ribbon + header card + tabs + onboarding grid. */
export function UserDetailLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <AppBar
        crumbs={[{ label: 'Members', href: '/users' }, { label: 'Member' }]}
      />
      <div className="body" aria-busy="true">
        <div className="card" style={{ marginBottom: 16, minHeight: 168 }} />
        <div className="tabs" style={{ marginBottom: 18, gap: 8 }}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="card"
              style={{ width: 128, minHeight: 36 }}
            />
          ))}
        </div>
        <div
          className="g"
          style={{
            gridTemplateColumns: 'minmax(0,1.55fr) minmax(0,1fr)',
            gap: 16,
          }}
        >
          <div className="card" style={{ minHeight: 360 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ minHeight: 180 }} />
            <div className="card" style={{ minHeight: 164 }} />
          </div>
        </div>
      </div>
    </>
  );
}
