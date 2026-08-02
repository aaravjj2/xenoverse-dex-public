'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import SpeciesIcon from '@/components/SpeciesIcon';

// Type chart for defensive calculations
const TYPE_CHART: Record<string, Record<string, number>> = {
    NORMAL: { FIGHTING: 2, GHOST: 0 },
    FIRE: { FIRE: 0.5, WATER: 2, GRASS: 0.5, ICE: 0.5, GROUND: 2, BUG: 0.5, ROCK: 2, STEEL: 0.5, FAIRY: 0.5 },
    WATER: { FIRE: 0.5, WATER: 0.5, ELECTRIC: 2, GRASS: 2, ICE: 0.5, STEEL: 0.5 },
    ELECTRIC: { ELECTRIC: 0.5, GROUND: 2, FLYING: 0.5, STEEL: 0.5 },
    GRASS: { FIRE: 2, WATER: 0.5, ELECTRIC: 0.5, GRASS: 0.5, ICE: 2, POISON: 2, GROUND: 0.5, FLYING: 2, BUG: 2 },
    ICE: { FIRE: 2, ICE: 0.5, FIGHTING: 2, ROCK: 2, STEEL: 2 },
    FIGHTING: { FLYING: 2, PSYCHIC: 2, BUG: 0.5, ROCK: 0.5, DARK: 0.5, FAIRY: 2 },
    POISON: { GRASS: 0.5, FIGHTING: 0.5, POISON: 0.5, GROUND: 2, PSYCHIC: 2, BUG: 0.5, FAIRY: 0.5 },
    GROUND: { WATER: 2, ELECTRIC: 0, GRASS: 2, ICE: 2, POISON: 0.5, ROCK: 0.5 },
    FLYING: { ELECTRIC: 2, GRASS: 0.5, ICE: 2, FIGHTING: 0.5, GROUND: 0, BUG: 0.5, ROCK: 2 },
    PSYCHIC: { FIGHTING: 0.5, PSYCHIC: 0.5, BUG: 2, GHOST: 2, DARK: 2 },
    BUG: { FIRE: 2, GRASS: 0.5, FIGHTING: 0.5, GROUND: 0.5, FLYING: 2, ROCK: 2 },
    ROCK: { NORMAL: 0.5, FIRE: 0.5, WATER: 2, GRASS: 2, FIGHTING: 2, POISON: 0.5, GROUND: 2, FLYING: 0.5, STEEL: 2 },
    GHOST: { NORMAL: 0, FIGHTING: 0, POISON: 0.5, BUG: 0.5, GHOST: 2, DARK: 2 },
    DRAGON: { FIRE: 0.5, WATER: 0.5, ELECTRIC: 0.5, GRASS: 0.5, ICE: 2, DRAGON: 2, FAIRY: 2 },
    DARK: { FIGHTING: 2, PSYCHIC: 0, BUG: 2, GHOST: 0.5, DARK: 0.5, FAIRY: 2 },
    STEEL: { NORMAL: 0.5, FIRE: 2, GRASS: 0.5, ICE: 0.5, FIGHTING: 2, POISON: 0, GROUND: 2, FLYING: 0.5, PSYCHIC: 0.5, BUG: 0.5, ROCK: 0.5, DRAGON: 0.5, STEEL: 0.5, FAIRY: 0.5 },
    FAIRY: { FIGHTING: 0.5, POISON: 2, BUG: 0.5, DRAGON: 0, DARK: 0.5, STEEL: 2 },
    SOUND: { STEEL: 0.5, PSYCHIC: 0.5 },
};

const ALL_TYPES = Object.keys(TYPE_CHART);

interface TeamMember {
    id: string;
    name: string;
    type1: string | null;
    type2: string | null;
    iconPath: string | null;
}

function calculateDefensiveMultiplier(attackType: string, defender: TeamMember): number {
    let mult = 1;
    if (defender.type1 && TYPE_CHART[defender.type1]?.[attackType] !== undefined) {
        mult *= TYPE_CHART[defender.type1][attackType];
    }
    if (defender.type2 && TYPE_CHART[defender.type2]?.[attackType] !== undefined) {
        mult *= TYPE_CHART[defender.type2][attackType];
    }
    return mult;
}

export default function TeamBuilder() {
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<TeamMember[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const searchPokemon = useCallback(async (term: string) => {
        if (term.length < 2) { setSearchResults([]); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/species?search=${encodeURIComponent(term)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (Array.isArray(data.species) ? data.species : []);
                setSearchResults(list.map((s: any) => ({
                    id: s.id, name: s.name, type1: s.type1, type2: s.type2, iconPath: s.icon_path,
                })));
            }
        } catch (e) { console.error('Search failed:', e); }
        setIsSearching(false);
    }, []);

    const addToTeam = (member: TeamMember) => {
        if (team.length < 6 && !team.find(m => m.id === member.id)) {
            setTeam([...team, member]);
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    const removeFromTeam = (id: string) => setTeam(team.filter(m => m.id !== id));

    const typeCoverage = useMemo(() => {
        const weaknesses: Record<string, number> = {};
        const resistances: Record<string, number> = {};
        const immunities: Record<string, number> = {};

        ALL_TYPES.forEach(type => {
            let weakCount = 0, resistCount = 0, immuneCount = 0;
            team.forEach(member => {
                const mult = calculateDefensiveMultiplier(type, member);
                if (mult > 1) weakCount++;
                else if (mult === 0) immuneCount++;
                else if (mult < 1) resistCount++;
            });
            if (weakCount > 0) weaknesses[type] = weakCount;
            if (resistCount > 0) resistances[type] = resistCount;
            if (immuneCount > 0) immunities[type] = immuneCount;
        });

        return { weaknesses, resistances, immunities };
    }, [team]);

    const teamWeaknessScore = useMemo(() => {
        return Object.values(typeCoverage.weaknesses).reduce((sum, count) => sum + count, 0);
    }, [typeCoverage]);

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gradient">Team Builder</h1>
                <p className="text-slate-400 text-sm mt-1">Build and analyze your dream team</p>
            </div>

            {/* Team Slots */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[...Array(6)].map((_, i) => {
                    const member = team[i];
                    return (
                        <div
                            key={i}
                            className={`aspect-square rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-4 relative group ${member
                                ? 'border-blue-500/30 glass-card'
                                : 'border-dashed border-[var(--border-medium)] bg-slate-900/30'
                                }`}
                        >
                            {member ? (
                                <>
                                    <SpeciesIcon
                                        iconPath={member.iconPath}
                                        speciesId={member.id}
                                        name={member.name}
                                        type1={member.type1}
                                        type2={member.type2}
                                        size={64}
                                    />
                                    <span className="text-sm font-medium mt-2 text-center text-white">{member.name}</span>
                                    <div className="flex gap-1 mt-1">
                                        {member.type1 && <span className={`type-badge type-${member.type1.toLowerCase()} text-[8px] px-1.5 py-0`}>{member.type1}</span>}
                                        {member.type2 && <span className={`type-badge type-${member.type2.toLowerCase()} text-[8px] px-1.5 py-0`}>{member.type2}</span>}
                                    </div>
                                    <button
                                        onClick={() => removeFromTeam(member.id)}
                                        className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-2">
                                        <span className="text-slate-600 text-lg">{i + 1}</span>
                                    </div>
                                    <span className="text-slate-600 text-xs">Empty</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Search */}
            {team.length < 6 && (
                <div className="mb-6 relative">
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); searchPokemon(e.target.value); }}
                            placeholder="Search Pokémon to add..."
                            className="w-full pl-11 pr-4 py-3.5 rounded-xl text-base placeholder-slate-500"
                        />
                    </div>
                    {searchResults.length > 0 && (
                        <div className="absolute w-full mt-2 glass-card !rounded-xl overflow-hidden shadow-2xl z-10 max-h-80 overflow-y-auto">
                            {searchResults.map(result => (
                                <button
                                    key={result.id}
                                    onClick={() => addToTeam(result)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/30 transition-colors text-left"
                                >
                                    <SpeciesIcon iconPath={result.iconPath} speciesId={result.id} name={result.name} type1={result.type1} type2={result.type2} size={40} />
                                    <span className="font-medium text-white">{result.name}</span>
                                    <div className="flex gap-1 ml-auto">
                                        {result.type1 && <span className={`type-badge type-${result.type1.toLowerCase()} text-xs px-2`}>{result.type1}</span>}
                                        {result.type2 && <span className={`type-badge type-${result.type2.toLowerCase()} text-xs px-2`}>{result.type2}</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Type Coverage Analysis */}
            {team.length > 0 && (
                <div className="glass-card !rounded-2xl p-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-5">
                        <h2 className="text-lg font-bold text-white">Type Coverage Analysis</h2>
                        <span className={`text-xs font-medium px-3 py-1 rounded-full border ${teamWeaknessScore <= 5 ? 'bg-green-900/20 text-green-400 border-green-500/20' :
                            teamWeaknessScore <= 10 ? 'bg-yellow-900/20 text-yellow-400 border-yellow-500/20' :
                                'bg-red-900/20 text-red-400 border-red-500/20'
                            }`}>
                            {teamWeaknessScore <= 5 ? 'Excellent' : teamWeaknessScore <= 10 ? 'Good' : 'Needs Work'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Weaknesses */}
                        <div>
                            <h3 className="text-[10px] text-red-400 uppercase tracking-wider font-bold mb-3">Weaknesses</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(typeCoverage.weaknesses).map(([type, count]) => (
                                    <span key={type} className={`type-badge type-${type.toLowerCase()} text-[10px] px-2 py-0.5 relative`}>
                                        {type}
                                        {count > 1 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{count}</span>
                                        )}
                                    </span>
                                ))}
                                {Object.keys(typeCoverage.weaknesses).length === 0 && (
                                    <span className="text-slate-600 text-sm">None!</span>
                                )}
                            </div>
                        </div>

                        {/* Resistances */}
                        <div>
                            <h3 className="text-[10px] text-green-400 uppercase tracking-wider font-bold mb-3">Resistances</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(typeCoverage.resistances).map(([type, count]) => (
                                    <span key={type} className={`type-badge type-${type.toLowerCase()} text-[10px] px-2 py-0.5 relative`}>
                                        {type}
                                        {count > 1 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{count}</span>
                                        )}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Immunities */}
                        <div>
                            <h3 className="text-[10px] text-purple-400 uppercase tracking-wider font-bold mb-3">Immunities</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(typeCoverage.immunities).map(([type, count]) => (
                                    <span key={type} className={`type-badge type-${type.toLowerCase()} text-[10px] px-2 py-0.5 relative`}>
                                        {type}
                                        {count > 1 && (
                                            <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">{count}</span>
                                        )}
                                    </span>
                                ))}
                                {Object.keys(typeCoverage.immunities).length === 0 && (
                                    <span className="text-slate-600 text-sm">None</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {team.length === 0 && (
                <div className="text-center py-12 glass-card !rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <p className="text-slate-400 text-lg">Your team is empty</p>
                    <p className="text-slate-500 text-sm mt-1">Search for Pokémon above to build your team</p>
                </div>
            )}
        </div>
    );
}
