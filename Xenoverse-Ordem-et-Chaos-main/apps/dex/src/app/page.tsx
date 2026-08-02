
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getSpeciesList } from '@/lib/db';
import FilterSidebar from '@/components/FilterSidebar';
import SpeciesIcon from '@/components/SpeciesIcon';

// Force dynamic rendering since we use searchParams
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Xenoverse Dex',
  description: 'Complete Pokedex for Pokemon Xenoverse',
};

// Type definitions for searchParams
interface HomeProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Helper to get type color for card accent
const getTypeAccentColor = (type: string | null): string => {
  if (!type) return 'from-slate-600 to-slate-700';
  const colors: Record<string, string> = {
    NORMAL: 'from-gray-400 to-gray-500',
    FIRE: 'from-orange-500 to-red-600',
    WATER: 'from-blue-500 to-cyan-600',
    ELECTRIC: 'from-yellow-400 to-amber-500',
    GRASS: 'from-green-500 to-emerald-600',
    ICE: 'from-cyan-300 to-blue-400',
    FIGHTING: 'from-red-700 to-red-900',
    POISON: 'from-purple-500 to-violet-700',
    GROUND: 'from-amber-600 to-yellow-700',
    FLYING: 'from-indigo-300 to-blue-400',
    PSYCHIC: 'from-pink-500 to-rose-600',
    BUG: 'from-lime-500 to-green-600',
    ROCK: 'from-amber-700 to-stone-800',
    GHOST: 'from-purple-700 to-indigo-900',
    DRAGON: 'from-indigo-600 to-purple-700',
    DARK: 'from-gray-700 to-slate-900',
    STEEL: 'from-gray-400 to-slate-500',
    FAIRY: 'from-pink-300 to-rose-400',
    SOUND: 'from-teal-400 to-cyan-500',
  };
  return colors[type] || 'from-slate-600 to-slate-700';
};

// Helper to get stat bar color
const getStatColor = (value: number): string => {
  if (value >= 150) return 'bg-gradient-to-r from-purple-500 to-pink-500';
  if (value >= 120) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
  if (value >= 90) return 'bg-gradient-to-r from-green-500 to-emerald-500';
  if (value >= 60) return 'bg-gradient-to-r from-yellow-500 to-amber-500';
  return 'bg-gradient-to-r from-slate-500 to-slate-600';
};

export default async function Home({ searchParams }: HomeProps) {
  // Parse searchParams - await in Next.js 15+
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const types = typeof params.types === 'string' ? params.types.split(',') : undefined;
  const typeMatch = params.typeMatch === 'all' ? 'all' : 'any';
  const bstMin = typeof params.bstMin === 'string' ? parseInt(params.bstMin) : undefined;
  const bstMax = typeof params.bstMax === 'string' ? parseInt(params.bstMax) : undefined;
  const sortBy = typeof params.sortBy === 'string' ? params.sortBy : 'dex';
  const sortOrder = params.sortOrder === 'desc' ? 'desc' : 'asc';
  const showForms = params.showForms === 'true';
  const ability = typeof params.ability === 'string' ? params.ability : undefined;
  const eggGroup = typeof params.eggGroup === 'string' ? params.eggGroup : undefined;
  const move = typeof params.move === 'string' ? params.move : undefined;

  // Fetch data
  const speciesList = await getSpeciesList({
    search,
    types,
    typeMatch,
    bstMin,
    bstMax,
    sortBy,
    sortOrder,
    baseOnly: !showForms,
    ability,
    eggGroup,
    move,
    limit: 1000,
  });

  return (
    <main className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Client-side Sidebar */}
      <FilterSidebar totalResults={speciesList.length} />

      {/* Server-side Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 transition-all duration-300">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gradient">
              Pokédex
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {speciesList.length.toLocaleString()} species found
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
          {speciesList.map((pkmn, index) => {
            const accentColor = getTypeAccentColor(pkmn.type1);
            return (
              <Link
                key={`${pkmn.id}_${pkmn.form_id}`}
                href={`/species/${pkmn.id}${pkmn.form_id > 0 ? `?form=${pkmn.form_id}` : ''}`}
                className="species-card group relative"
                style={{ animationDelay: `${Math.min(index * 20, 500)}ms` }}
              >
                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl`} />
                
                {/* Card Content */}
                <div className="relative z-10">
                  {/* Header: Dex Number + Dev Badge */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-slate-500 font-mono text-xs font-bold tracking-wider">
                      #{pkmn.dex_number ? String(pkmn.dex_number).padStart(3, '0') : '???'}
                    </span>
                    {pkmn.is_dev === 1 && (
                      <span className="bg-amber-500/10 text-amber-400 text-[10px] px-2 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                        DEV
                      </span>
                    )}
                  </div>

                  {/* Sprite */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="relative w-24 h-24 group-hover:scale-110 transition-transform duration-500 ease-out flex items-center justify-center">
                      {/* Subtle glow behind sprite */}
                      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${accentColor} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                      <SpeciesIcon
                        iconPath={pkmn.icon_path}
                        speciesId={pkmn.id}
                        name={pkmn.name}
                        type1={pkmn.type1}
                        type2={pkmn.type2}
                        size={96}
                        className="w-full h-full relative z-10"
                      />
                    </div>
                    <h3 className="font-bold text-slate-100 text-base group-hover:text-white transition-colors text-center leading-tight mt-2">
                      {pkmn.name}
                    </h3>
                    {pkmn.display_form_name && (
                      <span className="text-[11px] text-slate-400 mt-0.5 italic">
                        {pkmn.display_form_name}
                      </span>
                    )}
                  </div>

                  {/* Type Badges */}
                  <div className="flex justify-center gap-1.5 mb-4">
                    {pkmn.type1 && (
                      <span className={`type-badge type-${pkmn.type1.toLowerCase()} text-[9px] px-2 py-0.5`}>
                        {pkmn.type1}
                      </span>
                    )}
                    {pkmn.type2 && (
                      <span className={`type-badge type-${pkmn.type2.toLowerCase()} text-[9px] px-2 py-0.5`}>
                        {pkmn.type2}
                      </span>
                    )}
                  </div>

                  {/* Stats Mini Bars */}
                  <div className="space-y-1.5 relative z-10">
                    {[
                      { label: 'HP', value: pkmn.hp },
                      { label: 'ATK', value: pkmn.attack },
                      { label: 'DEF', value: pkmn.defense },
                      { label: 'SPA', value: pkmn.special_attack },
                      { label: 'SPD', value: pkmn.special_defense },
                      { label: 'SPE', value: pkmn.speed },
                    ].map((stat) => (
                      <div key={stat.label} className="flex items-center gap-2">
                        <span className="w-7 text-[10px] text-slate-500 font-medium">{stat.label}</span>
                        <span className="w-6 text-right text-[11px] text-slate-300 font-mono tabular-nums">{stat.value}</span>
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getStatColor(stat.value)} transition-all duration-500`}
                            style={{ width: `${Math.min((stat.value / 200) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {/* BST Total */}
                    <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-700/50">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">BST</span>
                      <span className="text-sm font-bold text-gradient tabular-nums">{pkmn.bst}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {speciesList.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-slate-400">No Pokémon found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your filters</p>
              <Link
                href="/"
                className="mt-6 px-5 py-2.5 btn-primary text-sm"
              >
                Clear Filters
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
