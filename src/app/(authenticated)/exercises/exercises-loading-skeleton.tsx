import { AppBar } from '@/components/medvanta/shell';

/** Exercise library loading shell: AppBar + toolbar + card grid. */
export function ExercisesLoadingSkeleton(): React.ReactElement {
  return (
    <>
      <AppBar crumbs={[{ label: 'Exercises' }]} title="Exercise library" />
      <div className="body" aria-busy="true">
        <div className="tbar" style={{ marginBottom: 14 }}>
          <div className="card" style={{ flex: 1, minHeight: 36 }} />
          <div className="card" style={{ width: 96, minHeight: 36 }} />
        </div>
        <div
          className="card"
          style={{ minHeight: 28, marginBottom: 14, maxWidth: 280 }}
        />
        <div className="g g4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="card" style={{ minHeight: 196 }} />
          ))}
        </div>
      </div>
    </>
  );
}
