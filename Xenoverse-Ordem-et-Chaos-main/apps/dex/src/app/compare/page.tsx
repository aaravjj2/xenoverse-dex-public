'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import SpeciesIcon from '@/components/SpeciesIcon';

interface Species {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  type1: string | null;
  type2: string | null;
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
  bst: number;
  ability1: string | null;
  ability2: string | null;
  hidden_ability: string | null;
  icon_path: string | null;
  front_path: string | null;
  height: number | null;
  weight: number | null;
}

interface SearchResult {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  display_form_name: string | null;
  icon_path: string | null;
  type1: string | null;
  type2: string | null;
}

export default function ComparePage() {
  const [species1, setSpecies1] = useState<Species | null>(null);
  const [species2, setSpecies2] = useState<Species | null>(null);
  const [results1, setResults1] = useState<SearchResult[]>([]);
  const [results2, setResults2] = useState<SearchResult[]>([]);
  const [showResults1, setShowResults1] = useState(false);
  const [showResults2, setShowResults2] = useState(false);
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);

  const timer1Ref = useRef<NodeJS.Timeout | null>(null);
  const timer2Ref = useRef<NodeJS.Timeout | null>(null);
  const searchTerm1Ref = useRef<string>('');
  const searchTerm2Ref = useRef<string>('');

  const searchPokemon = useCallback(async (term: string, slot: 1 | 2) => {
    if (slot === 1) searchTerm1Ref.current = term;
    else searchTerm2Ref.current = term;

    if (term.length < 2) {
      if (slot === 1) { setResults1([]); setIsLoading1(false); }
      else { setResults2([]); setIsLoading2(false); }
      return;
    }

    if (slot === 1) setIsLoading1(true);
    else setIsLoading2(true);

    try {
      const res = await fetch(`/api/species?search=${encodeURIComponent(term)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data.species) ? data.species : []);
        
        const currentTerm = slot === 1 ? searchTerm1Ref.current : searchTerm2Ref.current;
        if (currentTerm === term) {
          if (slot === 1) setResults1(list);
          else setResults2(list);
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      const currentTerm = slot === 1 ? searchTerm1Ref.current : searchTerm2Ref.current;
      if (currentTerm === term) {
        if (slot === 1) setIsLoading1(false);
        else setIsLoading2(false);
      }
    }
  }, []);

  const handleSearch1Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    searchTerm1Ref.current = term;
    setShowResults1(true);
    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (term.length < 2) { setIsLoading1(false); setResults1([]); return; }
    timer1Ref.current = setTimeout(() => searchPokemon(term, 1), 300);
  }, [searchPokemon]);

  const handleSearch2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    searchTerm2Ref.current = term;
    setShowResults2(true);
    if (timer2Ref.current) clearTimeout(timer2Ref.current);
    if (term.length < 2) { setIsLoading2(false); setResults2([]); return; }
    timer2Ref.current = setTimeout(() => searchPokemon(term, 2), 300);
  }, [searchPokemon]);

  const selectSpecies = async (id: string, formId: number, slot: 1 | 2) => {
    if (slot === 1) setShowResults1(false);
    else setShowResults2(false);

    try {
      const res = await fetch(`/api/species/${id}?form=${formId}`);
      const data = await res.json();
      if (slot === 1) { setSpecies1(data.species); setResults1([]); }
      else { setSpecies2(data.species); setResults2([]); }
    } catch (e) {
      console.error('Failed to load species:', e);
    }
  };

  const StatComparison = ({ label, stat1, stat2, color }: { label: string; stat1: number; stat2: number; color: string }) => {
    const diff = stat1 - stat2;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className={`font-mono tabular-nums ${stat1 > stat2 ? 'text-green-400 font-bold' : stat1 < stat2 ? 'text-red-400' : 'text-slate-300'}`}>
            {stat1}
          </span>
          <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">{label}</span>
          <span className={`font-mono tabular-nums ${stat2 > stat1 ? 'text-green-400 font-bold' : stat2 < stat1 ? 'text-red-400' : 'text-slate-300'}`}>
            {stat2}
          </span>
        </div>
        <div className="flex gap-1 h-3">
          <div className="flex-1 flex justify-end bg-slate-800/50 rounded-l-lg overflow-hidden">
            <div
              className={`bg-gradient-to-l ${color} h-full rounded-l-lg transition-all duration-700`}
              style={{ width: `${(stat1 / 255) * 100}%` }}
            />
          </div>
          <div className="flex-1 bg-slate-800/50 rounded-r-lg overflow-hidden">
            <div
              className={`bg-gradient-to-r ${color} h-full rounded-r-lg transition-all duration-700`}
              style={{ width: `${(stat2 / 255) * 100}%` }}
            />
          </div>
        </div>
        {diff !== 0 && (
          <div className="text-center text-[10px] mt-0.5">
            <span className={diff > 0 ? 'text-green-400' : 'text-red-400'}>
              {diff > 0 ? `+${diff} ←` : `${diff} →`}
            </span>
          </div>
        )}
      </div>
    );
  };

  const SpeciesSelector = ({ slot, species, results, showResults, setShowResults, handleChange, isLoading }: {
    slot: 1 | 2;
    species: Species | null;
    results: SearchResult[];
    showResults: boolean;
    setShowResults: (b: boolean) => void;
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isLoading: boolean;
  }) => (
    <div className="relative">
      {species ? (
        <div className="glass-card p-5 group border-blue-500/30">
          <button
            onClick={() => slot === 1 ? setSpecies1(null) : setSpecies2(null)}
            className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            ×
          </button>
          <div className="flex flex-col items-center">
            <SpeciesIcon
              iconPath={species.icon_path}
              frontPath={species.front_path}
              speciesId={species.id}
              name={species.name}
              type1={species.type1}
              type2={species.type2}
              size={120}
            />
            <Link href={`/species/${species.id}${species.form_id > 0 ? `?form=${species.form_id}` : ''}`} className="text-lg font-bold mt-3 text-gradient hover:opacity-80 transition">
              {species.name}
              {species.form_name && <span className="text-slate-400 text-sm ml-1">({species.form_name})</span>}
            </Link>
            <div className="flex gap-1.5 mt-2">
              {species.type1 && <span className={`type-badge type-${species.type1.toLowerCase()} text-xs px-2`}>{species.type1}</span>}
              {species.type2 && <span className={`type-badge type-${species.type2.toLowerCase()} text-xs px-2`}>{species.type2}</span>}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-5">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={`Search Pokémon ${slot}...`}
              onChange={handleChange}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full pl-10 pr-4 py-3 rounded-xl text-base placeholder-slate-500"
            />
          </div>
          {showResults && (results.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card !rounded-xl overflow-hidden shadow-2xl z-20 max-h-80 overflow-y-auto">
              {isLoading && results.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <div className="loading-spinner h-6 w-6 mx-auto"></div>
                </div>
              )}
              {results.map(r => (
                <button
                  key={`${r.id}-${r.form_id}`}
                  onMouseDown={(e) => { e.preventDefault(); selectSpecies(r.id, r.form_id, slot); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
                >
                  <SpeciesIcon iconPath={r.icon_path} speciesId={r.id} name={r.name} type1={r.type1} type2={r.type2} size={40} />
                  <span className="font-medium text-white">{r.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="h-[120px] flex items-center justify-center mt-4 border-2 border-dashed border-[var(--border-medium)] rounded-xl">
            <span className="text-slate-500 text-sm">Select a Pokémon</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gradient">Compare Pokémon</h1>
        <p className="text-slate-400 text-sm mt-1">Side-by-side stat comparison</p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <SpeciesSelector slot={1} species={species1} results={results1} showResults={showResults1} setShowResults={setShowResults1} handleChange={handleSearch1Change} isLoading={isLoading1} />
        <SpeciesSelector slot={2} species={species2} results={results2} showResults={showResults2} setShowResults={setShowResults2} handleChange={handleSearch2Change} isLoading={isLoading2} />
      </div>

      {/* Comparison */}
      {species1 && species2 && (
        <div className="glass-card !rounded-2xl p-6 animate-fade-in">
          <h2 className="text-lg font-bold text-center text-slate-300 mb-6">Stat Comparison</h2>

          <div className="max-w-2xl mx-auto">
            <StatComparison label="HP" stat1={species1.hp} stat2={species2.hp} color="from-red-500 to-rose-600" />
            <StatComparison label="Attack" stat1={species1.attack} stat2={species2.attack} color="from-orange-500 to-amber-600" />
            <StatComparison label="Defense" stat1={species1.defense} stat2={species2.defense} color="from-yellow-500 to-amber-500" />
            <StatComparison label="Sp. Atk" stat1={species1.special_attack} stat2={species2.special_attack} color="from-blue-500 to-indigo-600" />
            <StatComparison label="Sp. Def" stat1={species1.special_defense} stat2={species2.special_defense} color="from-green-500 to-emerald-600" />
            <StatComparison label="Speed" stat1={species1.speed} stat2={species2.speed} color="from-pink-500 to-fuchsia-600" />

            <div className="border-t border-[var(--border-subtle)] pt-4 mt-4">
              <StatComparison label="BST" stat1={species1.bst} stat2={species2.bst} color="from-purple-500 to-violet-600" />
            </div>
          </div>

          {/* Abilities Comparison */}
          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Abilities</h3>
              <div className="space-y-1.5">
                {species1.ability1 && <div className="text-slate-200 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-[var(--border-subtle)]">{species1.ability1}</div>}
                {species1.ability2 && <div className="text-slate-200 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-[var(--border-subtle)]">{species1.ability2}</div>}
                {species1.hidden_ability && <div className="text-purple-300 px-3 py-1.5 bg-purple-900/20 rounded-lg border border-purple-500/20">✨ {species1.hidden_ability}</div>}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Abilities</h3>
              <div className="space-y-1.5">
                {species2.ability1 && <div className="text-slate-200 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-[var(--border-subtle)]">{species2.ability1}</div>}
                {species2.ability2 && <div className="text-slate-200 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-[var(--border-subtle)]">{species2.ability2}</div>}
                {species2.hidden_ability && <div className="text-purple-300 px-3 py-1.5 bg-purple-900/20 rounded-lg border border-purple-500/20">✨ {species2.hidden_ability}</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {(!species1 || !species2) && (
        <div className="text-center py-12 glass-card !rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <p className="text-slate-400">Select two Pokémon above to compare their stats</p>
        </div>
      )}
    </div>
  );
}
