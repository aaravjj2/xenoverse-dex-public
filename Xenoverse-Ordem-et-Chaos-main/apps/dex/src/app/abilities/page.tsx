'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Ability {
  id: string;
  name: string;
  description: string | null;
}

export default function AbilitiesPage() {
  const [abilities, setAbilities] = useState<Ability[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAbilities() {
      try {
        const res = await fetch('/api/abilities');
        const data = await res.json();
        setAbilities(data.abilities || []);
      } catch (error) {
        console.error('Failed to load abilities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAbilities();
  }, []);

  const filtered = abilities.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Abilities</h1>
          <p className="text-slate-400 text-sm mt-1">{abilities.length} abilities</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search abilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-500"
          />
        </div>
      </div>

      {/* Abilities Grid */}
      <div className="grid gap-3">
        {filtered.map((ability, index) => (
          <Link
            key={ability.id}
            href={`/abilities/${ability.id}`}
            className="glass-card p-4 group flex items-start gap-4"
            style={{ animationDelay: `${Math.min(index * 15, 300)}ms` }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 border border-cyan-500/20 group-hover:border-cyan-500/40 transition-all">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">{ability.name}</h3>
              {ability.description && (
                <p className="text-slate-400 text-sm mt-1 line-clamp-2 leading-relaxed">{ability.description}</p>
              )}
            </div>
            <svg className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">No abilities found</p>
          </div>
        )}
      </div>
    </div>
  );
}
