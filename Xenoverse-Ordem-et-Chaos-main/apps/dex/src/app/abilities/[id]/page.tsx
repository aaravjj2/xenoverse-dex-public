'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SpriteDisplay from '@/components/SpriteDisplay';

interface Ability {
  id: string;
  name: string;
  description: string | null;
}

interface Species {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  type1: string | null;
  type2: string | null;
  ability1: string | null;
  ability2: string | null;
  hidden_ability: string | null;
  icon_path: string | null;
}

export default function AbilityDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [ability, setAbility] = useState<Ability | null>(null);
  const [species, setSpecies] = useState<Species[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAbility() {
      try {
        const res = await fetch(`/api/abilities/${id}`);
        if (!res.ok) throw new Error('Ability not found');
        const data = await res.json();
        setAbility(data.ability);
        setSpecies(data.species || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchAbility();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !ability) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Ability not found'}</p>
          <Link href="/abilities" className="text-blue-400 hover:text-blue-300">
            ← Back to Abilities
          </Link>
        </div>
      </div>
    );
  }

  // Group species by how they get this ability
  const byNormal = species.filter(s => s.ability1 === id || s.ability2 === id);
  const byHidden = species.filter(s => s.hidden_ability === id && s.ability1 !== id && s.ability2 !== id);

  return (
    <div className="h-full overflow-auto p-6">
      <Link href="/abilities" className="text-blue-400 hover:text-blue-300 text-sm mb-4 block">
        ← Back to Abilities
      </Link>

      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{ability.name}</h1>
        <p className="text-gray-500 text-sm mb-4">{ability.id}</p>
        {ability.description && (
          <p className="text-gray-300 text-lg">{ability.description}</p>
        )}
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          Pokémon with this ability ({species.length})
        </h2>

        {byNormal.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-gray-400 uppercase mb-3">Normal Ability ({byNormal.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {byNormal.map(s => (
                <Link
                  key={`${s.id}-${s.form_id}`}
                  href={`/species/${s.id}${s.form_id > 0 ? `?form=${s.form_id}` : ''}`}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
                >
                  {s.icon_path ? (
                    <SpriteDisplay
                      src={`/api/asset?path=${encodeURIComponent(s.icon_path)}`}
                      alt={s.name}
                      size={40}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-gray-500">?</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {s.name}
                      {s.form_name && <span className="text-gray-400 text-sm ml-1">({s.form_name})</span>}
                    </div>
                    <div className="flex gap-1">
                      {s.type1 && (
                        <span className={`type-badge type-${s.type1.toLowerCase()} text-xs`}>{s.type1}</span>
                      )}
                      {s.type2 && (
                        <span className={`type-badge type-${s.type2.toLowerCase()} text-xs`}>{s.type2}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {byHidden.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-400 uppercase mb-3">Hidden Ability ({byHidden.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {byHidden.map(s => (
                <Link
                  key={`${s.id}-${s.form_id}`}
                  href={`/species/${s.id}${s.form_id > 0 ? `?form=${s.form_id}` : ''}`}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
                >
                  {s.icon_path ? (
                    <SpriteDisplay
                      src={`/api/asset?path=${encodeURIComponent(s.icon_path)}`}
                      alt={s.name}
                      size={40}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-gray-500">?</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {s.name}
                      {s.form_name && <span className="text-gray-400 text-sm ml-1">({s.form_name})</span>}
                    </div>
                    <div className="flex gap-1">
                      {s.type1 && (
                        <span className={`type-badge type-${s.type1.toLowerCase()} text-xs`}>{s.type1}</span>
                      )}
                      {s.type2 && (
                        <span className={`type-badge type-${s.type2.toLowerCase()} text-xs`}>{s.type2}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {species.length === 0 && (
          <p className="text-gray-500">No Pokémon have this ability.</p>
        )}
      </div>
    </div>
  );
}
