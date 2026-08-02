import { SpeciesGridSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <main className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar placeholder */}
      <div className="hidden md:block w-72 lg:w-80 p-6 border-r border-[var(--border-subtle)] overflow-y-auto">
        <div className="space-y-4">
          <div className="skeleton" style={{ height: 40, width: '100%' }} />
          <div className="skeleton" style={{ height: 120, width: '100%' }} />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 32, width: '100%' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="skeleton" style={{ height: 32, width: 150 }} />
            <div className="skeleton mt-2" style={{ height: 16, width: 120 }} />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          <SpeciesGridSkeleton count={20} />
        </div>
      </div>
    </main>
  );
}
