import { AppBar } from '@/components/medvanta/shell';

/** Admin profile loading shell: AppBar + profile card + overview/compliance grid. */
export function AdminProfileLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <AppBar
        crumbs={[{ label: 'Manage', href: '/manage' }, { label: 'Admin' }]}
        title="Admin profile"
      />
      <div className="body" aria-busy="true">
        <div className="card" style={{ marginBottom: 16, minHeight: 200 }} />
        <div
          className="g"
          style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}
        >
          <div className="card" style={{ minHeight: 320 }} />
          <div className="card" style={{ minHeight: 320 }} />
        </div>
      </div>
    </>
  );
}
