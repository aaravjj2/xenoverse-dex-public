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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Abilities</h1>
          <p className="text-gray-400">{abilities.length} abilities</p>
        </div>
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Back to Dex
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search abilities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid gap-4">
        {filtered.map(ability => (
          <Link
            key={ability.id}
            href={`/abilities/${ability.id}`}
            className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition"
          >
            <h3 className="text-lg font-semibold text-blue-400">{ability.name}</h3>
            {ability.description && (
              <p className="text-gray-400 text-sm mt-1">{ability.description}</p>
            )}
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500">No abilities found.</p>
        )}
      </div>
    </div>
  );
}
