
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
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 h-full overflow-y-auto border border-slate-700/50 shadow-xl custom-scrollbar settings-sidebar">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Filters
                        </h2>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200 hover:underline"
                        >
                            Clear All
                        </button>
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Name or ID..."
                            className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-slate-500"
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-medium text-slate-300">Types</label>
                            <select
                                value={typeMatch}
                                onChange={(e) => setTypeMatch(e.target.value as 'any' | 'all')}
                                className="text-xs bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-slate-300"
                            >
                                <option value="any">Match Any</option>
                                <option value="all">Match All</option>
                            </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {TYPES.map(type => (
                                <button
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    className={`type-badge type-${type.toLowerCase()} ${selectedTypes.includes(type) ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-100'} cursor-pointer text-xs px-2 py-1 leading-none`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Search Section */}
                    <div className="mb-6 border-t border-slate-600/50 pt-4">
                        <h3 className="text-sm font-bold text-purple-400 mb-3">Advanced Search</h3>

                        {/* Ability Filter */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Ability</label>
                            <input
                                type="text"
                                value={ability}
                                onChange={(e) => setAbility(e.target.value)}
                                placeholder="e.g. Intimidate, Swift Swim..."
                                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 placeholder-slate-500"
                            />
                        </div>

                        {/* Egg Group Filter */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Egg Group</label>
                            <select
                                value={eggGroup}
                                onChange={(e) => setEggGroup(e.target.value)}
                                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 text-slate-300"
                            >
                                <option value="">Any Egg Group</option>
                                {EGG_GROUPS.map(eg => (
                                    <option key={eg} value={eg}>{eg}</option>
                                ))}
                            </select>
                        </div>

                        {/* Move Filter */}
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">Learns Move</label>
                            <input
                                type="text"
                                value={move}
                                onChange={(e) => setMove(e.target.value)}
                                placeholder="e.g. Earthquake, Stealth Rock..."
                                className="w-full bg-slate-900/80 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-200 placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* BST Range */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Base Stat Total</label>
                        <div className="flex gap-3">
                            <input
                                type="number"
                                value={bstMin}
                                onChange={(e) => setBstMin(e.target.value)}
                                placeholder="Min"
                                className="w-1/2 bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-slate-500"
                            />
                            <input
                                type="number"
                                value={bstMax}
                                onChange={(e) => setBstMax(e.target.value)}
                                placeholder="Max"
                                className="w-1/2 bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 placeholder-slate-500"
                            />
                        </div>
                    </div>

                    {/* Sort */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Sort By</label>
                        <div className="flex gap-3">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="flex-1 bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 text-slate-300"
                            >
                                <option value="dex">Dex #</option>
                                <option value="id">Internal ID</option>
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
                                className="bg-slate-900/80 border border-slate-600 rounded-lg px-4 py-2.5 text-sm hover:bg-slate-700 transition-all duration-200 font-medium text-slate-300"
                                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                        </div>
                    </div>

                    {/* Form Toggle */}
                    <div className="mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showForms}
                                onChange={(e) => setShowForms(e.target.checked)}
                                className="w-4 h-4 rounded bg-slate-900 border-slate-600 text-blue-500 focus:ring-blue-500/50"
                            />
                            <span className="text-sm text-slate-300">Show Alternate Forms</span>
                        </label>
                        <p className="text-xs text-slate-500 mt-1 ml-7">
                            Include Mega, Alolan, Galarian forms etc.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="text-sm text-slate-400 border-t border-slate-600/50 pt-4 font-medium">
                        <div className="flex items-center justify-between">
                            <span>Total Results</span>
                            <span className="text-blue-400 font-bold">{totalResults.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Toggle Sidebar Button */}
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="fixed left-6 bottom-6 z-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                title={showFilters ? 'Hide Filters' : 'Show Filters'}
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showFilters ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    )}
                </svg>
            </button>
        </>
    );
}
