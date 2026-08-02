'use client';

export function SpeciesCardSkeleton() {
  return (
    <div className="skeleton-species-card">
      <div className="skeleton skeleton-species-image" />
      <div className="skeleton skeleton-species-name skeleton-text" />
      <div className="skeleton-species-types">
        <div className="skeleton skeleton-species-type" />
        <div className="skeleton skeleton-species-type" />
      </div>
      <div className="skeleton-species-stats">
        <div className="skeleton skeleton-species-stat" style={{ width: '70%' }} />
        <div className="skeleton skeleton-species-stat" style={{ width: '55%' }} />
        <div className="skeleton skeleton-species-stat" style={{ width: '65%' }} />
      </div>
    </div>
  );
}

export function SpeciesGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SpeciesCardSkeleton key={i} />
      ))}
    </>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="skeleton-list-item">
      <div className="skeleton skeleton-list-item-image" />
      <div className="skeleton-list-item-content">
        <div className="skeleton skeleton-list-item-title skeleton-text" />
        <div className="skeleton skeleton-list-item-desc skeleton-text" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </>
  );
}

export function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6 flex items-center gap-6">
        <div className="skeleton skeleton-circle" style={{ width: 120, height: 120 }} />
        <div className="flex-1 space-y-3">
          <div className="skeleton skeleton-text" style={{ width: '40%', height: 24 }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', height: 16 }} />
          <div className="flex gap-2">
            <div className="skeleton" style={{ width: 64, height: 24, borderRadius: 12 }} />
            <div className="skeleton" style={{ width: 64, height: 24, borderRadius: 12 }} />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="glass-card p-6 space-y-4">
        <div className="skeleton skeleton-text" style={{ width: 120, height: 20 }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton skeleton-text" style={{ width: 40, height: 14 }} />
            <div className="flex-1 skeleton" style={{ height: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: 32, height: 14 }} />
          </div>
        ))}
      </div>
      
      {/* Description */}
      <div className="glass-card p-6 space-y-3">
        <div className="skeleton skeleton-text" style={{ width: 100, height: 20 }} />
        <div className="skeleton skeleton-text" style={{ width: '100%' }} />
        <div className="skeleton skeleton-text" style={{ width: '90%' }} />
        <div className="skeleton skeleton-text" style={{ width: '95%' }} />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] flex gap-4">
        <div className="skeleton skeleton-text" style={{ width: 80 }} />
        <div className="skeleton skeleton-text" style={{ width: 120 }} />
        <div className="skeleton skeleton-text" style={{ width: 100 }} />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-[var(--border-subtle)] flex gap-4">
          <div className="skeleton skeleton-text" style={{ width: 80 }} />
          <div className="skeleton skeleton-text" style={{ width: 120 }} />
          <div className="skeleton skeleton-text" style={{ width: 100 }} />
        </div>
      ))}
    </div>
  );
}
