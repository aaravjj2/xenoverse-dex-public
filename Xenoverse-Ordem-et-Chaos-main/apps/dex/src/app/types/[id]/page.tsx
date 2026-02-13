'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SpriteDisplay from '@/components/SpriteDisplay';
import SpeciesIcon from '@/components/SpeciesIcon';

interface TypeData {
  id: string;
  name: string;
  weaknesses: string | null;
  resistances: string | null;
  immunities: string | null;
}

interface Species {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  type1: string | null;
  type2: string | null;
  bst: number;
  icon_path: string | null;
  front_path?: string | null;
}

export default function TypeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [type, setType] = useState<TypeData | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'bst'>('name');

  useEffect(() => {
    async function fetchType() {
      try {
        const res = await fetch(`/api/types/${id}`);
        if (!res.ok) throw new Error('Type not found');
        const data = await res.json();
        setType(data.type);
        setSpecies(data.species || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchType();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !type) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Type not found'}</p>
          <Link href="/types" className="text-blue-400 hover:text-blue-300">
            ← Back to Types
          </Link>
        </div>
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

  const weaknesses = parseTypeList(type.weaknesses);
  const resistances = parseTypeList(type.resistances);
  const immunities = parseTypeList(type.immunities);

  const sortedSpecies = [...species].sort((a, b) => {
    if (sortBy === 'bst') return b.bst - a.bst;
    return a.name.localeCompare(b.name);
  });

  // Separate mono-type and dual-type
  const monoType = sortedSpecies.filter(s => !s.type2 || s.type2 === s.type1);
  const dualType = sortedSpecies.filter(s => s.type2 && s.type2 !== s.type1);

  return (
    <div className="h-full overflow-auto p-6">
      <Link href="/types" className="text-blue-400 hover:text-blue-300 text-sm mb-4 block">
        ← Back to Types
      </Link>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <span className={`type-badge type-${type.id.toLowerCase()} text-2xl px-6 py-2`}>
            {type.name}
          </span>
          <span className="text-gray-500">{species.length} Pokémon</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm text-red-400 uppercase mb-2">Weak to (×2 damage)</h3>
            {weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {weaknesses.map(t => (
                  <Link key={t} href={`/types/${t}`}>
                    <span className={`type-badge type-${t.toLowerCase()}`}>{t}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>

          <div>
            <h3 className="text-sm text-green-400 uppercase mb-2">Resists (×0.5 damage)</h3>
            {resistances.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {resistances.map(t => (
                  <Link key={t} href={`/types/${t}`}>
                    <span className={`type-badge type-${t.toLowerCase()}`}>{t}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>

          <div>
            <h3 className="text-sm text-gray-400 uppercase mb-2">Immune to (×0 damage)</h3>
            {immunities.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {immunities.map(t => (
                  <Link key={t} href={`/types/${t}`}>
                    <span className={`type-badge type-${t.toLowerCase()}`}>{t}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">None</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pokémon</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'bst')}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
            >
              <option value="name">Name</option>
              <option value="bst">BST</option>
            </select>
          </div>
        </div>

        {monoType.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 uppercase mb-3">Pure {type.name} ({monoType.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {monoType.map(s => (
                <Link
                  key={`${s.id}-${s.form_id}`}
                  href={`/species/${s.id}${s.form_id > 0 ? `?form=${s.form_id}` : ''}`}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
                >
                  <SpeciesIcon
                    iconPath={s.icon_path}
                    frontPath={s.front_path}
                    speciesId={s.id}
                    name={s.name}
                    type1={s.type1}
                    type2={s.type2}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {s.name}
                      {s.form_name && <span className="text-gray-400 text-sm ml-1">({s.form_name})</span>}
                    </div>
                    <div className="text-gray-500 text-xs">BST: {s.bst}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {dualType.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 uppercase mb-3">Dual Type ({dualType.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {dualType.map(s => (
                <Link
                  key={`${s.id}-${s.form_id}`}
                  href={`/species/${s.id}${s.form_id > 0 ? `?form=${s.form_id}` : ''}`}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
                >
                  <SpeciesIcon
                    iconPath={s.icon_path}
                    frontPath={s.front_path}
                    speciesId={s.id}
                    name={s.name}
                    type1={s.type1}
                    type2={s.type2}
                    size={40}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {s.name}
                      {s.form_name && <span className="text-gray-400 text-sm ml-1">({s.form_name})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {s.type1 && (
                          <span className={`type-badge type-${s.type1.toLowerCase()} text-xs`}>{s.type1}</span>
                        )}
                        {s.type2 && (
                          <span className={`type-badge type-${s.type2.toLowerCase()} text-xs`}>{s.type2}</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-xs">BST: {s.bst}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {species.length === 0 && (
          <p className="text-gray-500">No Pokémon have this type.</p>
        )}
      </div>
    </div>
  );
}
