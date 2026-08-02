import { ListSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="skeleton" style={{ height: 32, width: 150 }} />
        <div className="skeleton mt-2" style={{ height: 16, width: 250 }} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="skeleton" style={{ height: 36, width: 120 }} />
        <div className="skeleton" style={{ height: 36, width: 120 }} />
        <div className="skeleton" style={{ height: 36, width: 120 }} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <ListSkeleton count={12} />
      </div>
    </div>
  );
}
