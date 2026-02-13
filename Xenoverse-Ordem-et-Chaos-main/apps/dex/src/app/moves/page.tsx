'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Move {
  id: string;
  name: string;
  type: string | null;
  category: string | null;
  power: number | null;
  is_variable_power: number;
  accuracy: number | null;
  pp: number | null;
  priority: number;
  description: string | null;
  flags: string[];
}

const TYPES = [
  'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE',
  'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
  'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY',
  'SOUND'
];

const CATEGORIES = ['Physical', 'Special', 'Status'];

const FLAGS = [
  'Biting', 'Bomb', 'CanMirrorMove', 'CanProtect', 'CannotMetronome',
  'Contact', 'Dance', 'HighCriticalHitRate', 'Kick', 'Light', 'Powder',
  'Pulse', 'Punching', 'Slicing', 'Sound', 'ThawsUser',
  'TramplesMinimize', 'Wind'
];

export default function MovesPage() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFlag, setSelectedFlag] = useState<string>('');
  const [powerMin, setPowerMin] = useState<string>('');
  const [powerMax, setPowerMax] = useState<string>('');
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);

  const parentRef = useRef<HTMLDivElement>(null);

  const fetchMoves = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedType) params.set('type', selectedType);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedFlag) params.set('flag', selectedFlag);
      if (powerMin) params.set('powerMin', powerMin);
      if (powerMax) params.set('powerMax', powerMax);

      const response = await fetch(`/api/moves?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch moves');

      const data = await response.json();
      setMoves(data.moves || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedType, selectedCategory, selectedFlag, powerMin, powerMax]);

  useEffect(() => {
    const timer = setTimeout(fetchMoves, 300);
    return () => clearTimeout(timer);
  }, [fetchMoves]);

  const virtualizer = useVirtualizer({
    count: moves.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 10,
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedType('');
    setSelectedCategory('');
    setSelectedFlag('');
    setPowerMin('');
    setPowerMax('');
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar Filters */}
      <aside className="w-64 bg-gray-900 rounded-lg p-4 overflow-y-auto flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Clear
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or ID..."
            className="w-full bg-gray-800 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type Filter */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Flag Filter */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Flag</label>
          <select
            value={selectedFlag}
            onChange={(e) => setSelectedFlag(e.target.value)}
            className="w-full bg-gray-800 rounded px-3 py-2 text-sm"
          >
            <option value="">All Flags</option>
            {FLAGS.map(flag => (
              <option key={flag} value={flag}>{flag}</option>
            ))}
          </select>
        </div>

        {/* Power Range */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-1">Power</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={powerMin}
              onChange={(e) => setPowerMin(e.target.value)}
              placeholder="Min"
              className="w-1/2 bg-gray-800 rounded px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={powerMax}
              onChange={(e) => setPowerMax(e.target.value)}
              placeholder="Max"
              className="w-1/2 bg-gray-800 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-500 border-t border-gray-700 pt-4">
          {moves.length.toLocaleString()} results
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h1 className="text-2xl font-bold">Moves</h1>
          <p className="text-gray-400 text-sm">
            Browse all moves in the Xenoverse fangame
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 flex gap-4 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center bg-gray-900 rounded-lg">
              <div className="text-center">
                <p className="text-red-400 mb-2">Error: {error}</p>
                <button
                  onClick={fetchMoves}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Move List */}
              <div
                ref={parentRef}
                className="flex-1 overflow-auto bg-gray-900 rounded-lg"
              >
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const move = moves[virtualItem.index];
                    const isSelected = selectedMove?.id === move.id;
                    return (
                      <div
                        key={move.id}
                        onClick={() => setSelectedMove(move)}
                        className={`absolute top-0 left-0 w-full flex items-center gap-4 p-3 cursor-pointer border-b border-gray-800 ${isSelected ? 'bg-blue-900/30' : 'hover:bg-gray-800'
                          }`}
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{move.name}</span>
                          <span className="text-xs text-gray-500">{move.id}</span>
                        </div>

                        {/* Type */}
                        {move.type && (
                          <span className={`type-badge type-${move.type.toLowerCase()}`}>
                            {move.type}
                          </span>
                        )}

                        {/* Category */}
                        <span className={`text-xs px-2 py-1 rounded ${move.category === 'Physical' ? 'bg-red-900/50 text-red-300' :
                          move.category === 'Special' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                          {move.category || '-'}
                        </span>

                        {/* Power */}
                        <span className="w-12 text-right text-sm">
                          {move.is_variable_power ? 'Varies' : (move.power || '-')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Move Detail Panel */}
              {selectedMove && (
                <div className="w-80 bg-gray-900 rounded-lg p-4 overflow-y-auto flex-shrink-0">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">{selectedMove.name}</h2>
                    <button
                      onClick={() => setSelectedMove(null)}
                      className="text-gray-500 hover:text-white"
                      title="Close"
                    >
                      ✕
                    </button>
                    <Link
                      href={`/moves/${selectedMove.id}`}
                      className="text-blue-400 hover:text-blue-300 ml-2"
                      title="Open full page"
                    >
                      ↗
                    </Link>
                  </div>

                  <p className="text-sm text-gray-500 mb-4">{selectedMove.id}</p>

                  {selectedMove.type && (
                    <div className="mb-4">
                      <span className={`type-badge type-${selectedMove.type.toLowerCase()} text-base px-4 py-1`}>
                        {selectedMove.type}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-400">Category</div>
                      <div className="font-medium">{selectedMove.category || '-'}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-400">Power</div>
                      <div className="font-medium">{selectedMove.power || '-'}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-400">Accuracy</div>
                      <div className="font-medium">{selectedMove.accuracy || '-'}%</div>
                    </div>
                    <div className="bg-gray-800 rounded p-3">
                      <div className="text-xs text-gray-400">PP</div>
                      <div className="font-medium">{selectedMove.pp || '-'}</div>
                    </div>
                    <div className="bg-gray-800 rounded p-3 col-span-2">
                      <div className="text-xs text-gray-400">Priority</div>
                      <div className="font-medium">{selectedMove.priority}</div>
                    </div>
                  </div>

                  {selectedMove.description && (
                    <div className="mb-4">
                      <div className="text-xs text-gray-400 mb-1">Description</div>
                      <p className="text-sm">{selectedMove.description}</p>
                    </div>
                  )}

                  {selectedMove.flags && selectedMove.flags.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Flags</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedMove.flags.map(flag => (
                          <span key={flag} className="bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
