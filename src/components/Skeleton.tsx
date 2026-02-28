export function SkeletonCard({ lines = 3, height }: { lines?: number; height?: number }) {
  return (
    <div className="card skeleton-card" style={{ height }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            width: i === 0 ? '60%' : i === lines - 1 ? '40%' : '85%',
            height: i === 0 ? 14 : 10,
            marginBottom: i < lines - 1 ? 10 : 0,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton-card" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12 }}>
          <div className="skeleton-line" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-line" style={{ width: '70%', height: 12, marginBottom: 6 }} />
            <div className="skeleton-line" style={{ width: '45%', height: 10 }} />
          </div>
        </div>
      ))}
    </>
  );
}

export function SkeletonProgress() {
  return (
    <div className="card skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="skeleton-line" style={{ width: '40%', height: 12 }} />
        <div className="skeleton-line" style={{ width: 30, height: 12 }} />
      </div>
      <div className="skeleton-line" style={{ width: '100%', height: 6, borderRadius: 100 }} />
    </div>
  );
}
