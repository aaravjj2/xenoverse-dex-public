import { ListSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="skeleton" style={{ height: 32, width: 200 }} />
        <div className="skeleton mt-2" style={{ height: 16, width: 300 }} />
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="skeleton" style={{ height: 44, width: '100%' }} />
      </div>

      {/* List */}
      <div className="space-y-3">
        <ListSkeleton count={10} />
      </div>
    </div>
  );
}
