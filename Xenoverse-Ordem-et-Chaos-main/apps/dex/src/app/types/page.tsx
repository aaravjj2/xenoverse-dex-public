'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface TypeData {
  id: string;
  name: string;
  weaknesses: string | null;
  resistances: string | null;
  immunities: string | null;
}

export default function TypesPage() {
  const [types, setTypes] = useState<TypeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');

  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch('/api/types');
        const data = await res.json();
        setTypes(data.types || []);
      } catch (error) {
        console.error('Failed to load types:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTypes();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }

  const parseTypeList = (str: string | null): string[] => {
    if (!str) return [];
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  const getDefenseMultiplier = (attackType: string, defendType: TypeData): number => {
    if (parseTypeList(defendType.immunities).includes(attackType)) return 0;
    if (parseTypeList(defendType.weaknesses).includes(attackType)) return 2;
    if (parseTypeList(defendType.resistances).includes(attackType)) return 0.5;
    return 1;
  };

  const effectivenessColor = (mult: number): string => {
    if (mult === 0) return 'bg-slate-800 text-slate-600';
    if (mult === 0.5) return 'bg-red-900/40 text-red-400 border border-red-500/20';
    if (mult === 2) return 'bg-green-900/40 text-green-400 border border-green-500/20';
    if (mult === 4) return 'bg-green-800/50 text-green-300 border border-green-400/30';
    if (mult === 0.25) return 'bg-red-800/40 text-red-300 border border-red-400/20';
    return 'bg-slate-800/30 text-slate-500';
  };

  const effectivenessText = (mult: number): string => {
    if (mult === 0) return '×0';
    if (mult === 0.5) return '½';
    if (mult === 2) return '×2';
    if (mult === 4) return '×4';
    if (mult === 0.25) return '¼';
    return '—';
  };

  return (
    <div className="h-full overflow-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Type Chart</h1>
          <p className="text-slate-400 text-sm mt-1">{types.length} types</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-800/50 rounded-xl p-1 border border-[var(--border-subtle)]">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'chart' && (
        <div className="glass-card !rounded-2xl p-5 overflow-x-auto animate-fade-in">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-900/40 border border-green-500/20"></span>
              Super effective
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-red-900/40 border border-red-500/20"></span>
              Not very effective
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-800"></span>
              No effect
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">↓ Attack → Defend</div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-1.5"></th>
                {types.map(t => (
                  <th key={t.id} className="p-1.5">
                    <Link href={`/types/${t.id}`}>
                      <span className={`type-badge type-${t.id.toLowerCase()} text-[9px] whitespace-nowrap px-1.5 py-0.5`}>
                        {t.name.slice(0, 3).toUpperCase()}
                      </span>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.map(attackType => (
                <tr key={attackType.id}>
                  <td className="p-1.5">
                    <Link href={`/types/${attackType.id}`}>
                      <span className={`type-badge type-${attackType.id.toLowerCase()} text-[9px] px-1.5 py-0.5`}>
                        {attackType.name.slice(0, 3).toUpperCase()}
                      </span>
                    </Link>
                  </td>
                  {types.map(defendType => {
                    const mult = getDefenseMultiplier(attackType.id, defendType);
                    return (
                      <td key={defendType.id} className="p-1.5">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold ${effectivenessColor(mult)}`}>
                          {mult !== 1 && effectivenessText(mult)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {types.map(type => {
            const weaknesses = parseTypeList(type.weaknesses);
            const resistances = parseTypeList(type.resistances);
            const immunities = parseTypeList(type.immunities);
            return (
              <Link
                key={type.id}
                href={`/types/${type.id}`}
                className="glass-card p-5 group"
              >
                <div className="mb-4">
                  <span className={`type-badge type-${type.id.toLowerCase()} text-lg px-5 py-1.5`}>
                    {type.name}
                  </span>
                </div>
                
                {weaknesses.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10px] text-red-400 uppercase tracking-wider font-bold">Weak to </span>
                    <span className="text-sm text-slate-300">{weaknesses.join(', ')}</span>
                  </div>
                )}
                
                {resistances.length > 0 && (
                  <div className="mb-3">
                    <span className="text-[10px] text-green-400 uppercase tracking-wider font-bold">Resists </span>
                    <span className="text-sm text-slate-300">{resistances.join(', ')}</span>
                  </div>
                )}
                
                {immunities.length > 0 && (
                  <div>
                    <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Immune to </span>
                    <span className="text-sm text-slate-300">{immunities.join(', ')}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
