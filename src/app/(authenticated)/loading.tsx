/** Route-level fallback while authenticated segment data resolves. */
export default function AuthenticatedLoading(): React.ReactElement {
  return (
    <div className="main body" aria-busy="true">
      <div className="card" style={{ minHeight: 240 }} />
    </div>
  );
}
