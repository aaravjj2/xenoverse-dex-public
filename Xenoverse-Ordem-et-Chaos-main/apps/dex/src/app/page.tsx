
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
    limit: 1000, // Fetch all for now or implement pagination
  });

  return (
    <main className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Client-side Sidebar */}
      <FilterSidebar totalResults={speciesList.length} />

      {/* Server-side Grid */}
      <div className="flex-1 overflow-y-auto p-6 transition-all duration-300">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {speciesList.map((pkmn) => (
            <Link
              key={`${pkmn.id}_${pkmn.form_id}`}
              href={`/species/${pkmn.id}${pkmn.form_id > 0 ? `?form=${pkmn.form_id}` : ''}`}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex justify-between items-start mb-4 relative z-10">
                <span className="text-slate-500 font-mono text-xs font-bold tracking-wider">
                  #{pkmn.dex_number ? String(pkmn.dex_number).padStart(3, '0') : '???'}
                </span>
                {pkmn.is_dev === 1 && (
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] px-1.5 py-0.5 rounded border border-amber-500/20">
                    DEV
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center mb-4 relative z-10">
                <div className="relative w-24 h-24 mb-2 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-lg flex items-center justify-center">
                  <SpeciesIcon
                    iconPath={pkmn.icon_path}
                    speciesId={pkmn.id}
                    name={pkmn.name}
                    type1={pkmn.type1}
                    type2={pkmn.type2}
                    size={96}
                    className="w-full h-full"
                  />
                </div>
                <h3 className="font-bold text-slate-100 text-lg group-hover:text-blue-400 transition-colors text-center leading-tight">
                  {pkmn.name}
                </h3>
                {pkmn.display_form_name && (
                  <span className="text-xs text-slate-400 mt-1 italic">
                    {pkmn.display_form_name}
                  </span>
                )}
              </div>

              <div className="flex justify-center gap-2 mb-3 relative z-10">
                {pkmn.type1 && (
                  <span className={`type-badge type-${pkmn.type1.toLowerCase()} text-[10px] px-2 py-0.5 shadow-sm`}>
                    {pkmn.type1}
                  </span>
                )}
                {pkmn.type2 && (
                  <span className={`type-badge type-${pkmn.type2.toLowerCase()} text-[10px] px-2 py-0.5 shadow-sm`}>
                    {pkmn.type2}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400 relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-between">
                  <span>HP</span>
                  <span className="text-slate-200 font-medium">{pkmn.hp}</span>
                </div>
                <div className="flex justify-between">
                  <span>Atk</span>
                  <span className="text-slate-200 font-medium">{pkmn.attack}</span>
                </div>
                <div className="flex justify-between">
                  <span>Def</span>
                  <span className="text-slate-200 font-medium">{pkmn.defense}</span>
                </div>
                <div className="flex justify-between">
                  <span>SpA</span>
                  <span className="text-slate-200 font-medium">{pkmn.special_attack}</span>
                </div>
                <div className="flex justify-between">
                  <span>SpD</span>
                  <span className="text-slate-200 font-medium">{pkmn.special_defense}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spe</span>
                  <span className="text-slate-200 font-medium">{pkmn.speed}</span>
                </div>
                <div className="col-span-2 flex justify-between border-t border-slate-700/50 mt-1 pt-1">
                  <span className="font-medium text-blue-400">Total</span>
                  <span className="font-bold text-slate-100">{pkmn.bst}</span>
                </div>
              </div>
            </Link>
          ))}

          {speciesList.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-lg">No Pokémon found matching your filters.</p>
              <Link
                href="/"
                className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700 transition-colors"
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
