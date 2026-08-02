import { ListSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="hidden lg:block w-80 border-r border-[var(--border-subtle)] p-4 overflow-y-auto">
        <div className="mb-4">
          <div className="skeleton" style={{ height: 44, width: '100%' }} />
        </div>
        <div className="space-y-2">
          <ListSkeleton count={8} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 300, width: '100%' }} />
      </div>
    </div>
  );
}
