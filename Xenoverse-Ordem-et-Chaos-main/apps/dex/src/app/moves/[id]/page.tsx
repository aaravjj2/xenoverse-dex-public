'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SpriteDisplay from '@/components/SpriteDisplay';

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
  target: string | null;
  description: string | null;
  flags: string[];
}

interface LearnedBy {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  type1: string | null;
  type2: string | null;
  icon_path: string | null;
  learn_method: string;
  level: number | null;
}

export default function MoveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [move, setMove] = useState<Move | null>(null);
  const [learnedBy, setLearnedBy] = useState<LearnedBy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMove() {
      try {
        const res = await fetch(`/api/moves/${id}`);
        if (!res.ok) throw new Error('Move not found');
        const data = await res.json();
        setMove(data.move);
        setLearnedBy(data.learnedBy || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchMove();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !move) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Move not found'}</p>
          <Link href="/moves" className="text-blue-400 hover:text-blue-300">
            ← Back to Moves
          </Link>
        </div>
      </div>
    );
  }

  // Group by learn method
  const byMethod = learnedBy.reduce((acc, entry) => {
    const method = entry.learn_method || 'other';
    if (!acc[method]) acc[method] = [];
    acc[method].push(entry);
    return acc;
  }, {} as Record<string, LearnedBy[]>);

  const categoryColors: Record<string, string> = {
    'Physical': 'bg-orange-600',
    'Special': 'bg-blue-600',
    'Status': 'bg-gray-600',
  };

  return (
    <div className="h-full overflow-auto p-6">
      <Link href="/moves" className="text-blue-400 hover:text-blue-300 text-sm mb-4 block">
        ← Back to Moves
      </Link>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{move.name}</h1>
            <p className="text-gray-500 text-sm mb-4">{move.id}</p>
          </div>
          <div className="flex gap-2">
            {move.type && (
              <Link href={`/types/${move.type}`}>
                <span className={`type-badge type-${move.type.toLowerCase()} text-lg px-4 py-1`}>{move.type}</span>
              </Link>
            )}
            {move.category && (
              <span className={`${categoryColors[move.category] || 'bg-gray-600'} px-4 py-1 rounded text-white text-lg`}>
                {move.category}
              </span>
            )}
          </div>
        </div>

        {move.description && (
          <p className="text-gray-300 text-lg mb-6 border-l-2 border-gray-700 pl-4 italic">
            {move.description}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase">Power</div>
            <div className="text-2xl font-bold">{move.is_variable_power ? 'Varies' : (move.power || '—')}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase">Accuracy</div>
            <div className="text-2xl font-bold">{move.accuracy ? `${move.accuracy}%` : '—'}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase">PP</div>
            <div className="text-2xl font-bold">{move.pp || '—'}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-xs text-gray-500 uppercase">Priority</div>
            <div className="text-2xl font-bold">{move.priority > 0 ? `+${move.priority}` : move.priority}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {move.target && (
            <div>
              <span className="text-gray-400 mr-2">Target:</span>
              <span className="text-gray-300">{move.target.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          )}

          {move.flags && move.flags.length > 0 && (
            <div>
              <span className="text-gray-400 mr-2">Flags:</span>
              <span className="text-gray-300 space-x-2">
                {move.flags.map(flag => (
                  <span key={flag} className="inline-block bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-sm">
                    {flag}
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Learned by ({learnedBy.length} Pokémon)
        </h2>

        {Object.entries(byMethod).map(([method, pokemon]) => (
          <div key={method} className="mb-6">
            <h3 className="text-sm text-gray-400 uppercase mb-3">
              {method.replace('_', ' ')} ({pokemon.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pokemon.map((p, i) => (
                <Link
                  key={`${p.id}-${p.form_id}-${i}`}
                  href={`/species/${p.id}${p.form_id > 0 ? `?form=${p.form_id}` : ''}`}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
                >
                  {p.icon_path ? (
                    <SpriteDisplay
                      src={`/api/asset?path=${encodeURIComponent(p.icon_path)}`}
                      alt={p.name}
                      size={40}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-gray-500">?</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {p.name}
                      {p.form_name && <span className="text-gray-400 text-sm ml-1">({p.form_name})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {p.type1 && (
                          <span className={`type-badge type-${p.type1.toLowerCase()} text-xs`}>{p.type1}</span>
                        )}
                        {p.type2 && (
                          <span className={`type-badge type-${p.type2.toLowerCase()} text-xs`}>{p.type2}</span>
                        )}
                      </div>
                      {method === 'level_up' && p.level !== null && (
                        <span className="text-gray-500 text-xs">Lv. {p.level}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {learnedBy.length === 0 && (
          <p className="text-gray-500">No Pokémon learn this move.</p>
        )}
      </div>
    </div>
  );
}
