/** Main-column placeholder while auth or route segment data resolves (chrome stays mounted). */
export function AuthenticatedMainFallback(): React.ReactElement {
  return (
    <div className="body" aria-busy="true">
      <div className="card" style={{ minHeight: 240 }} />
    </div>
  );
}
