import { AppBar } from '@/components/medvanta/shell';

/** Admin profile loading shell: crumb ribbon + profile + stats + overview grid. */
export function AdminProfileLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <AppBar
        crumbs={[{ label: 'Manage', href: '/manage' }, { label: 'Admin' }]}
      />
      <div className="body" aria-busy="true">
        <div className="card" style={{ marginBottom: 16, minHeight: 120 }} />
        <div className="g g3" style={{ marginBottom: 16 }}>
          <div className="stat" style={{ minHeight: 96 }} />
          <div className="stat" style={{ minHeight: 96 }} />
          <div className="stat" style={{ minHeight: 96 }} />
        </div>
        <div
          className="g"
          style={{
            gridTemplateColumns: 'minmax(0,1.35fr) minmax(0,1fr)',
            gap: 16,
          }}
        >
          <div className="card" style={{ minHeight: 240 }} />
          <div className="card" style={{ minHeight: 240 }} />
        </div>
      </div>
    </>
  );
}
