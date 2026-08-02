import { ListSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="skeleton" style={{ height: 32, width: 180 }} />
        <div className="skeleton mt-2" style={{ height: 16, width: 280 }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <div className="skeleton" style={{ height: 36, width: 80 }} />
        <div className="skeleton" style={{ height: 36, width: 80 }} />
      </div>

      {/* List */}
      <div className="space-y-4">
        <ListSkeleton count={8} />
      </div>
    </div>
  );
}
