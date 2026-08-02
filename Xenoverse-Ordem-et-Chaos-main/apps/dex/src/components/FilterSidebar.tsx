
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

const TYPES = [
    'NORMAL', 'FIRE', 'WATER', 'ELECTRIC', 'GRASS', 'ICE',
    'FIGHTING', 'POISON', 'GROUND', 'FLYING', 'PSYCHIC', 'BUG',
    'ROCK', 'GHOST', 'DRAGON', 'DARK', 'STEEL', 'FAIRY',
    'SOUND'
];

const EGG_GROUPS = [
    'Monster', 'Water1', 'Water2', 'Water3', 'Bug', 'Flying', 'Field',
    'Fairy', 'Grass', 'Human-Like', 'Mineral', 'Amorphous', 'Ditto',
    'Dragon', 'Undiscovered'
];

export default function FilterSidebar({ totalResults }: { totalResults: number }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [showFilters, setShowFilters] = useState(true);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [search, setSearch] = useState(searchParams.get('search') || '');
    const [selectedTypes, setSelectedTypes] = useState<string[]>(searchParams.get('types')?.split(',').filter(Boolean) || []);
    const [typeMatch, setTypeMatch] = useState<'any' | 'all'>(searchParams.get('typeMatch') as 'any' | 'all' || 'any');
    const [bstMin, setBstMin] = useState(searchParams.get('bstMin') || '');
    const [bstMax, setBstMax] = useState(searchParams.get('bstMax') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'dex');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc');
    const [showForms, setShowForms] = useState(searchParams.get('showForms') === 'true');

    // Advanced Search
    const [ability, setAbility] = useState(searchParams.get('ability') || '');
    const [eggGroup, setEggGroup] = useState(searchParams.get('eggGroup') || '');
    const [move, setMove] = useState(searchParams.get('move') || '');

    const hasActiveFilters = search || selectedTypes.length > 0 || bstMin || bstMax || ability || eggGroup || move || showForms || sortBy !== 'dex' || sortOrder !== 'asc';

    const updateUrl = useCallback(() => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (selectedTypes.length > 0) params.set('types', selectedTypes.join(','));
        if (typeMatch !== 'any') params.set('typeMatch', typeMatch);
        if (bstMin) params.set('bstMin', bstMin);
        if (bstMax) params.set('bstMax', bstMax);
        if (sortBy !== 'dex') params.set('sortBy', sortBy);
        if (sortOrder !== 'asc') params.set('sortOrder', sortOrder);
        if (showForms) params.set('showForms', 'true');
        if (ability) params.set('ability', ability);
        if (eggGroup) params.set('eggGroup', eggGroup);
        if (move) params.set('move', move);

        router.replace(`${pathname}?${params.toString()}`);
    }, [search, selectedTypes, typeMatch, bstMin, bstMax, sortBy, sortOrder, showForms, ability, eggGroup, move, pathname, router]);

    useEffect(() => {
        const timer = setTimeout(updateUrl, 300);
        return () => clearTimeout(timer);
    }, [updateUrl]);

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedTypes([]);
        setTypeMatch('any');
        setBstMin('');
        setBstMax('');
        setSortBy('dex');
        setSortOrder('asc');
        setShowForms(false);
        setAbility('');
        setEggGroup('');
        setMove('');
    };

    return (
        <>
            <aside className={`${showFilters ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden flex-shrink-0`}>
                <div className="w-80 glass-card h-full overflow-y-auto !rounded-none !border-0 !border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)]/80">
                    {/* Header */}
                    <div className="flex justify-between items-center p-5 border-b border-[var(--border-subtle)]">
                        <h2 className="text-lg font-bold text-gradient">Filters</h2>
                        <div className="flex items-center gap-2">
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                                >
                                    Clear All
                                </button>
                            )}
                            <button
                                onClick={() => setShowFilters(false)}
                                className="lg:hidden text-slate-400 hover:text-white p-1"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Search */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Search</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or ID..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-500"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Types</label>
                                <select
                                    value={typeMatch}
                                    onChange={(e) => setTypeMatch(e.target.value as 'any' | 'all')}
                                    className="text-[11px] rounded-lg px-2 py-1 text-slate-300"
                                >
                                    <option value="any">Match Any</option>
                                    <option value="all">Match All</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {TYPES.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleType(type)}
                                        className={`type-badge type-${type.toLowerCase()} text-[10px] px-2 py-0.5 cursor-pointer transition-all duration-200 ${selectedTypes.includes(type) ? 'ring-2 ring-white/60 scale-105 opacity-100' : 'opacity-50 hover:opacity-80'
                                            }`}
                                    >
                                        {type.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* BST Range */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Base Stat Total</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={bstMin}
                                    onChange={(e) => setBstMin(e.target.value)}
                                    placeholder="Min"
                                    className="w-1/2 rounded-xl px-3 py-2.5 text-sm placeholder-slate-500"
                                />
                                <span className="flex items-center text-slate-500">–</span>
                                <input
                                    type="number"
                                    value={bstMax}
                                    onChange={(e) => setBstMax(e.target.value)}
                                    placeholder="Max"
                                    className="w-1/2 rounded-xl px-3 py-2.5 text-sm placeholder-slate-500"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sort By</label>
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-300"
                                >
                                    <option value="dex">Dex #</option>
                                    <option value="name">Name</option>
                                    <option value="bst">BST</option>
                                    <option value="hp">HP</option>
                                    <option value="attack">Attack</option>
                                    <option value="defense">Defense</option>
                                    <option value="spa">Sp.Atk</option>
                                    <option value="spd">Sp.Def</option>
                                    <option value="spe">Speed</option>
                                </select>
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="rounded-xl px-3 py-2.5 text-sm hover:bg-slate-700/50 transition-all font-medium text-slate-300 border border-[var(--border-subtle)]"
                                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                >
                                    {sortOrder === 'asc' ? '↑' : '↓'}
                                </button>
                            </div>
                        </div>

                        {/* Advanced Search (Collapsible) */}
                        <div className="border-t border-[var(--border-subtle)] pt-4">
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-300 transition-colors"
                            >
                                <span>Advanced Search</span>
                                <span className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
                            </button>

                            {showAdvanced && (
                                <div className="mt-3 space-y-3 animate-fade-in">
                                    {/* Ability Filter */}
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Ability</label>
                                        <input
                                            type="text"
                                            value={ability}
                                            onChange={(e) => setAbility(e.target.value)}
                                            placeholder="e.g. Intimidate..."
                                            className="w-full rounded-xl px-3 py-2 text-sm placeholder-slate-500"
                                        />
                                    </div>

                                    {/* Egg Group Filter */}
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Egg Group</label>
                                        <select
                                            value={eggGroup}
                                            onChange={(e) => setEggGroup(e.target.value)}
                                            className="w-full rounded-xl px-3 py-2 text-sm text-slate-300"
                                        >
                                            <option value="">Any Egg Group</option>
                                            {EGG_GROUPS.map(eg => (
                                                <option key={eg} value={eg}>{eg}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Move Filter */}
                                    <div>
                                        <label className="block text-[11px] font-medium text-slate-500 mb-1">Learns Move</label>
                                        <input
                                            type="text"
                                            value={move}
                                            onChange={(e) => setMove(e.target.value)}
                                            placeholder="e.g. Earthquake..."
                                            className="w-full rounded-xl px-3 py-2 text-sm placeholder-slate-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Toggle */}
                        <div className="border-t border-[var(--border-subtle)] pt-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={showForms}
                                        onChange={(e) => setShowForms(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-700 rounded-full peer-checked:bg-blue-500 transition-colors" />
                                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                                </div>
                                <div>
                                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Show Alternate Forms</span>
                                    <p className="text-[10px] text-slate-500">Include Mega, Alolan, etc.</p>
                                </div>
                            </label>
                        </div>

                        {/* Stats */}
                        <div className="border-t border-[var(--border-subtle)] pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">Results</span>
                                <span className="text-lg font-bold text-gradient tabular-nums">{totalResults.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Toggle Sidebar Button */}
            {!showFilters && (
                <button
                    onClick={() => setShowFilters(true)}
                    className="fixed left-4 bottom-6 z-10 btn-primary rounded-full p-3 shadow-lg animate-fade-in"
                    title="Show Filters"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>
            )}
        </>
    );
}
