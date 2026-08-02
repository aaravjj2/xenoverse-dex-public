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
    estimateSize: () => 52,
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
    <div className="flex h-[calc(100vh-6rem)] gap-4 animate-fade-in">
      {/* Sidebar Filters */}
      <aside className="w-64 glass-card !rounded-2xl p-5 overflow-y-auto flex-shrink-0 hidden md:block">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-sm font-bold text-gradient uppercase tracking-wider">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
          >
            Clear
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Search</label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm placeholder-slate-500"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="mb-4">
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            {TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Flag Filter */}
        <div className="mb-4">
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Flag</label>
          <select
            value={selectedFlag}
            onChange={(e) => setSelectedFlag(e.target.value)}
            className="w-full rounded-xl px-3 py-2 text-sm"
          >
            <option value="">All Flags</option>
            {FLAGS.map(flag => (
              <option key={flag} value={flag}>{flag}</option>
            ))}
          </select>
        </div>

        {/* Power Range */}
        <div className="mb-4">
          <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-bold">Power</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={powerMin}
              onChange={(e) => setPowerMin(e.target.value)}
              placeholder="Min"
              className="w-1/2 rounded-xl px-3 py-2 text-sm placeholder-slate-500"
            />
            <input
              type="number"
              value={powerMax}
              onChange={(e) => setPowerMax(e.target.value)}
              placeholder="Max"
              className="w-1/2 rounded-xl px-3 py-2 text-sm placeholder-slate-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="text-sm text-slate-400 border-t border-[var(--border-subtle)] pt-4 mt-4">
          <span className="text-gradient font-bold text-lg tabular-nums">{moves.length.toLocaleString()}</span>
          <span className="text-xs ml-2">results</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="glass-card !rounded-2xl p-5 mb-4">
          <h1 className="text-2xl font-bold text-gradient">Moves</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse all moves in the Xenoverse fangame
          </p>
        </div>

        {/* Results */}
        <div className="flex-1 flex gap-4 min-h-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center glass-card !rounded-2xl">
              <div className="loading-spinner h-12 w-12"></div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center glass-card !rounded-2xl">
              <div className="text-center">
                <p className="text-rose-400 mb-3">Error: {error}</p>
                <button
                  onClick={fetchMoves}
                  className="btn-primary text-sm"
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
                className="flex-1 overflow-auto glass-card !rounded-2xl"
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
                        className={`absolute top-0 left-0 w-full flex items-center gap-4 px-5 cursor-pointer border-b border-[var(--border-subtle)] transition-all ${isSelected ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-800/30'
                          }`}
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {/* Name */}
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-white truncate block">{move.name}</span>
                          <span className="text-[10px] text-slate-500">{move.id}</span>
                        </div>

                        {/* Type */}
                        {move.type && (
                          <span className={`type-badge type-${move.type.toLowerCase()} text-[10px] px-2 py-0.5`}>
                            {move.type}
                          </span>
                        )}

                        {/* Category */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${move.category === 'Physical' ? 'bg-red-900/30 text-red-400 border border-red-500/20' :
                          move.category === 'Special' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' :
                            'bg-slate-800 text-slate-400 border border-[var(--border-subtle)]'
                          }`}>
                          {move.category || '-'}
                        </span>

                        {/* Power */}
                        <span className="w-14 text-right text-sm font-mono tabular-nums text-slate-300">
                          {move.is_variable_power ? 'Varies' : (move.power || '-')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Move Detail Panel */}
              {selectedMove && (
                <div className="w-80 glass-card !rounded-2xl p-5 overflow-y-auto flex-shrink-0 animate-slide-in-right hidden lg:block">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-white">{selectedMove.name}</h2>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/moves/${selectedMove.id}`}
                        className="text-blue-400 hover:text-blue-300 p-1"
                        title="Open full page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </Link>
                      <button
                        onClick={() => setSelectedMove(null)}
                        className="text-slate-500 hover:text-white p-1"
                        title="Close"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 font-mono">{selectedMove.id}</p>

                  {selectedMove.type && (
                    <div className="mb-4">
                      <span className={`type-badge type-${selectedMove.type.toLowerCase()} text-sm px-4 py-1`}>
                        {selectedMove.type}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Category</div>
                      <div className="font-medium text-white mt-0.5">{selectedMove.category || '-'}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Power</div>
                      <div className="font-medium text-white mt-0.5">{selectedMove.power || '-'}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Accuracy</div>
                      <div className="font-medium text-white mt-0.5">{selectedMove.accuracy || '-'}%</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">PP</div>
                      <div className="font-medium text-white mt-0.5">{selectedMove.pp || '-'}</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-3 border border-[var(--border-subtle)] col-span-2">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Priority</div>
                      <div className="font-medium text-white mt-0.5">{selectedMove.priority}</div>
                    </div>
                  </div>

                  {selectedMove.description && (
                    <div className="mb-5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Description</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{selectedMove.description}</p>
                    </div>
                  )}

                  {selectedMove.flags && selectedMove.flags.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Flags</div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMove.flags.map(flag => (
                          <span key={flag} className="bg-slate-800/50 border border-[var(--border-subtle)] rounded-lg px-2.5 py-1 text-xs text-slate-300">
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
