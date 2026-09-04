import { AppBar } from '@/components/medvanta/shell';

/** Manage admins loading shell: AppBar + filters toolbar + table placeholder. */
export function ManageLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <AppBar crumbs={[{ label: 'Manage' }]} title="Manage" />
      <div className="body" aria-busy="true">
        <div className="tbar" style={{ marginBottom: 14 }}>
          <div className="card" style={{ flex: 1, minHeight: 36 }} />
          <div className="card" style={{ width: 96, minHeight: 36 }} />
        </div>
        <div
          className="card"
          style={{ minHeight: 28, marginBottom: 14, maxWidth: 280 }}
        />
        <div className="card card-flush" style={{ minHeight: 480 }} />
      </div>
    </>
  );
}
