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

  // Refs for debounce timers - no re-renders on keystroke
  const timer1Ref = useRef<NodeJS.Timeout | null>(null);
  const timer2Ref = useRef<NodeJS.Timeout | null>(null);
  // Refs to track current search terms to prevent race conditions
  const searchTerm1Ref = useRef<string>('');
  const searchTerm2Ref = useRef<string>('');

  const searchPokemon = useCallback(async (term: string, slot: 1 | 2) => {
    // Store current search term
    if (slot === 1) searchTerm1Ref.current = term;
    else searchTerm2Ref.current = term;

    if (term.length < 2) {
      if (slot === 1) {
        setResults1([]);
        setIsLoading1(false);
      } else {
        setResults2([]);
        setIsLoading2(false);
      }
      return;
    }

    if (slot === 1) setIsLoading1(true);
    else setIsLoading2(true);

    try {
      const res = await fetch(`/api/species?search=${encodeURIComponent(term)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (Array.isArray(data.species) ? data.species : []);
        
        // Only update results if this is still the current search term (prevent race conditions)
        const currentTerm = slot === 1 ? searchTerm1Ref.current : searchTerm2Ref.current;
        if (currentTerm === term) {
          if (slot === 1) setResults1(list);
          else setResults2(list);
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
    } finally {
      // Only clear loading if this is still the current search
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
    
    // Clear loading state immediately if search is too short
    if (term.length < 2) {
      setIsLoading1(false);
      setResults1([]);
      return;
    }
    
    // Only set loading after debounce delay to avoid flicker
    timer1Ref.current = setTimeout(() => searchPokemon(term, 1), 300);
  }, [searchPokemon]);

  const handleSearch2Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    searchTerm2Ref.current = term;
    setShowResults2(true);

    if (timer2Ref.current) clearTimeout(timer2Ref.current);
    
    // Clear loading state immediately if search is too short
    if (term.length < 2) {
      setIsLoading2(false);
      setResults2([]);
      return;
    }
    
    // Only set loading after debounce delay to avoid flicker
    timer2Ref.current = setTimeout(() => searchPokemon(term, 2), 300);
  }, [searchPokemon]);

  const selectSpecies = async (id: string, formId: number, slot: 1 | 2) => {
    if (slot === 1) setShowResults1(false);
    else setShowResults2(false);

    try {
      const res = await fetch(`/api/species/${id}?form=${formId}`);
      const data = await res.json();
      if (slot === 1) {
        setSpecies1(data.species);
        setResults1([]);
      } else {
        setSpecies2(data.species);
        setResults2([]);
      }
    } catch (e) {
      console.error('Failed to load species:', e);
    }
  };

  const StatComparison = ({ label, stat1, stat2, color }: { label: string; stat1: number; stat2: number; color: string }) => {
    const max = Math.max(stat1, stat2, 1);
    const diff = stat1 - stat2;
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span className={stat1 > stat2 ? 'text-green-400 font-semibold' : stat1 < stat2 ? 'text-red-400' : ''}>
            {stat1}
          </span>
          <span className="font-medium">{label}</span>
          <span className={stat2 > stat1 ? 'text-green-400 font-semibold' : stat2 < stat1 ? 'text-red-400' : ''}>
            {stat2}
          </span>
        </div>
        <div className="flex gap-1 h-4">
          <div className="flex-1 flex justify-end">
            <div
              className={`${color} rounded-l h-full`}
              style={{ width: `${(stat1 / 255) * 100}%` }}
            ></div>
          </div>
          <div className="flex-1">
            <div
              className={`${color} rounded-r h-full`}
              style={{ width: `${(stat2 / 255) * 100}%` }}
            ></div>
          </div>
        </div>
        {diff !== 0 && (
          <div className="text-center text-xs mt-1">
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
        <div className="bg-gray-800 rounded-lg p-4 relative group transition-all duration-300 border-2 border-blue-500/50">
          <button
            onClick={() => slot === 1 ? setSpecies1(null) : setSpecies2(null)}
            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
            <Link href={`/species/${species.id}${species.form_id > 0 ? `?form=${species.form_id}` : ''}`} className="text-lg font-semibold mt-2 text-blue-400 hover:text-blue-300">
              {species.name}
              {species.form_name && <span className="text-gray-400 text-sm ml-1">({species.form_name})</span>}
            </Link>
            <div className="flex gap-1 mt-1">
              {species.type1 && (
                <span className={`type-badge type-${species.type1.toLowerCase()} text-xs px-2`}>{species.type1}</span>
              )}
              {species.type2 && (
                <span className={`type-badge type-${species.type2.toLowerCase()} text-xs px-2`}>{species.type2}</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-4 relative">
          <input
            type="text"
            placeholder={`Search Pokémon ${slot}...`}
            onChange={handleChange}
            onFocus={() => setShowResults(true)}
            onBlur={() => {
              // Delay hiding results to allow click events to fire
              setTimeout(() => setShowResults(false), 200);
            }}
            className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
          />
          {showResults && (results.length > 0 || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-xl z-20 max-h-96 overflow-y-auto">
              {isLoading && results.length === 0 && (
                <div className="px-4 py-8 text-center text-blue-400">
                  <span className="animate-pulse">Searching...</span>
                </div>
              )}
              {results.map(r => (
                <button
                  key={`${r.id}-${r.form_id}`}
                  onMouseDown={(e) => {
                    // Use onMouseDown instead of onClick to fire before onBlur
                    e.preventDefault();
                    selectSpecies(r.id, r.form_id, slot);
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                >
                  <SpeciesIcon
                    iconPath={r.icon_path}
                    speciesId={r.id}
                    name={r.name}
                    type1={r.type1}
                    type2={r.type2}
                    size={40}
                  />
                  <span className="font-medium">
                    {r.name}
                    {(r.display_form_name || r.form_name) && <span className="text-gray-400 text-sm ml-1">({r.display_form_name || r.form_name})</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className="h-[120px] flex items-center justify-center mt-4 border-2 border-dashed border-slate-700 rounded-xl">
            <span className="text-slate-500">Select a Pokémon</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Compare Pokémon</h1>
        <Link href="/" className="text-blue-400 hover:text-blue-300">
          ← Back to Dex
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SpeciesSelector
          slot={1}
          species={species1}
          results={results1}
          showResults={showResults1}
          setShowResults={setShowResults1}
          handleChange={handleSearch1Change}
          isLoading={isLoading1}
        />
        <SpeciesSelector
          slot={2}
          species={species2}
          results={results2}
          showResults={showResults2}
          setShowResults={setShowResults2}
          handleChange={handleSearch2Change}
          isLoading={isLoading2}
        />
      </div>

      {/* Comparison Section */}
      {species1 && species2 && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-6 text-center">Stat Comparison</h2>

          <div className="max-w-2xl mx-auto">
            <StatComparison label="HP" stat1={species1.hp} stat2={species2.hp} color="bg-red-500" />
            <StatComparison label="Attack" stat1={species1.attack} stat2={species2.attack} color="bg-orange-500" />
            <StatComparison label="Defense" stat1={species1.defense} stat2={species2.defense} color="bg-yellow-500" />
            <StatComparison label="Sp. Atk" stat1={species1.special_attack} stat2={species2.special_attack} color="bg-blue-500" />
            <StatComparison label="Sp. Def" stat1={species1.special_defense} stat2={species2.special_defense} color="bg-green-500" />
            <StatComparison label="Speed" stat1={species1.speed} stat2={species2.speed} color="bg-pink-500" />

            <div className="border-t border-gray-700 pt-4 mt-4">
              <StatComparison label="BST" stat1={species1.bst} stat2={species2.bst} color="bg-purple-500" />
            </div>
          </div>

          {/* Abilities Comparison */}
          <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="text-gray-400 mb-2">Abilities</h3>
              <div className="space-y-1">
                {species1.ability1 && <div className="text-white">{species1.ability1}</div>}
                {species1.ability2 && <div className="text-white">{species1.ability2}</div>}
                {species1.hidden_ability && <div className="text-purple-400">{species1.hidden_ability} (HA)</div>}
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-gray-400 mb-2">Abilities</h3>
              <div className="space-y-1">
                {species2.ability1 && <div className="text-white">{species2.ability1}</div>}
                {species2.ability2 && <div className="text-white">{species2.ability2}</div>}
                {species2.hidden_ability && <div className="text-purple-400">{species2.hidden_ability} (HA)</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {(!species1 || !species2) && (
        <div className="text-center text-gray-500 mt-12">
          <p>Select two Pokémon above to compare their stats</p>
        </div>
      )}
    </div>
  );
}
