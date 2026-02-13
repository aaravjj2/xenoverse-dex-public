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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Helper to parse JSON array or comma-separated string
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

  // Build effectiveness matrix
  // For each defending type, calculate what attacking types are super effective, not very effective, or immune
  const getDefenseMultiplier = (attackType: string, defendType: TypeData): number => {
    if (parseTypeList(defendType.immunities).includes(attackType)) return 0;
    if (parseTypeList(defendType.weaknesses).includes(attackType)) return 2;
    if (parseTypeList(defendType.resistances).includes(attackType)) return 0.5;
    return 1;
  };

  const effectivenessColor = (mult: number): string => {
    if (mult === 0) return 'bg-gray-800 text-gray-500';
    if (mult === 0.5) return 'bg-red-900/50 text-red-400';
    if (mult === 2) return 'bg-green-900/50 text-green-400';
    if (mult === 4) return 'bg-green-700/50 text-green-300';
    if (mult === 0.25) return 'bg-red-700/50 text-red-300';
    return 'bg-gray-700/30 text-gray-500';
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
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Type Chart</h1>
          <p className="text-gray-400">{types.length} types</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-1 rounded ${viewMode === 'chart' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-1 rounded ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
            >
              List
            </button>
          </div>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Dex
          </Link>
        </div>
      </div>

      {viewMode === 'chart' && (
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <div className="mb-4 text-sm text-gray-400">
            <span className="inline-block w-4 h-4 bg-green-900/50 rounded mr-1"></span> Super effective
            <span className="inline-block w-4 h-4 bg-red-900/50 rounded ml-4 mr-1"></span> Not very effective
            <span className="inline-block w-4 h-4 bg-gray-800 rounded ml-4 mr-1"></span> No effect
          </div>
          <div className="text-xs mb-2 text-gray-500">↓ Attack / Defend →</div>
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-1 text-xs"></th>
                {types.map(t => (
                  <th key={t.id} className="p-1">
                    <Link href={`/types/${t.id}`}>
                      <span className={`type-badge type-${t.id.toLowerCase()} text-xs whitespace-nowrap`}>
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
                  <td className="p-1">
                    <Link href={`/types/${attackType.id}`}>
                      <span className={`type-badge type-${attackType.id.toLowerCase()} text-xs`}>
                        {attackType.name.slice(0, 3).toUpperCase()}
                      </span>
                    </Link>
                  </td>
                  {types.map(defendType => {
                    const mult = getDefenseMultiplier(attackType.id, defendType);
                    return (
                      <td key={defendType.id} className="p-1">
                        <div className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold ${effectivenessColor(mult)}`}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(type => {
            const weaknesses = parseTypeList(type.weaknesses);
            const resistances = parseTypeList(type.resistances);
            const immunities = parseTypeList(type.immunities);
            return (
              <Link
                key={type.id}
                href={`/types/${type.id}`}
                className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className={`type-badge type-${type.id.toLowerCase()} text-lg px-4 py-1`}>
                    {type.name}
                  </span>
                </div>
                
                {weaknesses.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-red-400 uppercase">Weak to: </span>
                    <span className="text-sm text-gray-300">{weaknesses.join(', ')}</span>
                  </div>
                )}
                
                {resistances.length > 0 && (
                  <div className="mb-2">
                    <span className="text-xs text-green-400 uppercase">Resists: </span>
                    <span className="text-sm text-gray-300">{resistances.join(', ')}</span>
                  </div>
                )}
                
                {immunities.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-400 uppercase">Immune to: </span>
                    <span className="text-sm text-gray-300">{immunities.join(', ')}</span>
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
