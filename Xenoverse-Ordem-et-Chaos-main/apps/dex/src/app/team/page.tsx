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
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/species?search=${encodeURIComponent(term)}&limit=10`);
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : (Array.isArray(data.species) ? data.species : []);
                setSearchResults(list.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    type1: s.type1,
                    type2: s.type2,
                    iconPath: s.icon_path,
                })));
            }
        } catch (e) {
            console.error('Search failed:', e);
        }
        setIsSearching(false);
    }, []);

    const addToTeam = (member: TeamMember) => {
        if (team.length < 6 && !team.find(m => m.id === member.id)) {
            setTeam([...team, member]);
            setSearchTerm('');
            setSearchResults([]);
        }
    };

    const removeFromTeam = (id: string) => {
        setTeam(team.filter(m => m.id !== id));
    };

    // Type Coverage Analysis
    const typeCoverage = useMemo(() => {
        const weaknesses: Record<string, number> = {};
        const resistances: Record<string, number> = {};
        const immunities: Record<string, number> = {};

        ALL_TYPES.forEach(type => {
            let weakCount = 0;
            let resistCount = 0;
            let immuneCount = 0;

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
        // Higher is worse - sum of how many team members are weak to each type
        return Object.values(typeCoverage.weaknesses).reduce((sum, count) => sum + count, 0);
    }, [typeCoverage]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Team Builder
                    </h1>
                    <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                        ← Back to Dex
                    </Link>
                </div>

                {/* Team Slots */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {[...Array(6)].map((_, i) => {
                        const member = team[i];
                        return (
                            <div
                                key={i}
                                className={`aspect-square rounded-xl border-2 border-dashed ${member ? 'border-blue-500 bg-slate-800/50' : 'border-slate-600 bg-slate-900/50'
                                    } flex flex-col items-center justify-center p-4 relative group transition-all duration-300`}
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
                                        <span className="text-sm font-medium mt-2 text-center">{member.name}</span>
                                        <div className="flex gap-1 mt-1">
                                            {member.type1 && (
                                                <span className={`type-badge type-${member.type1.toLowerCase()} text-[8px] px-1`}>
                                                    {member.type1}
                                                </span>
                                            )}
                                            {member.type2 && (
                                                <span className={`type-badge type-${member.type2.toLowerCase()} text-[8px] px-1`}>
                                                    {member.type2}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeFromTeam(member.id)}
                                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-slate-500 text-sm">Slot {i + 1}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Search */}
                {team.length < 6 && (
                    <div className="mb-8 relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                searchPokemon(e.target.value);
                            }}
                            placeholder="Search Pokémon to add..."
                            className="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-xl z-10">
                                {searchResults.map(result => (
                                    <button
                                        key={result.id}
                                        onClick={() => addToTeam(result)}
                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                                    >
                                        <SpeciesIcon
                                            iconPath={result.iconPath}
                                            speciesId={result.id}
                                            name={result.name}
                                            type1={result.type1}
                                            type2={result.type2}
                                            size={40}
                                        />
                                        <span className="font-medium">{result.name}</span>
                                        <div className="flex gap-1 ml-auto">
                                            {result.type1 && (
                                                <span className={`type-badge type-${result.type1.toLowerCase()} text-xs px-2`}>
                                                    {result.type1}
                                                </span>
                                            )}
                                            {result.type2 && (
                                                <span className={`type-badge type-${result.type2.toLowerCase()} text-xs px-2`}>
                                                    {result.type2}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Type Coverage Analysis */}
                {team.length > 0 && (
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-3">
                            Type Coverage Analysis
                            <span className={`text-sm font-normal px-3 py-1 rounded-full ${teamWeaknessScore <= 5 ? 'bg-green-500/20 text-green-400' :
                                    teamWeaknessScore <= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                                }`}>
                                Team Score: {teamWeaknessScore <= 5 ? 'Excellent' : teamWeaknessScore <= 10 ? 'Good' : 'Needs Work'}
                            </span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Weaknesses */}
                            <div>
                                <h3 className="text-red-400 font-medium mb-2">Weaknesses</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(typeCoverage.weaknesses).map(([type, count]) => (
                                        <span key={type} className={`type-badge type-${type.toLowerCase()} text-xs px-2 py-1 relative`}>
                                            {type}
                                            {count > 1 && (
                                                <span className="absolute -top-2 -right-2 bg-red-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                                    {count}
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                    {Object.keys(typeCoverage.weaknesses).length === 0 && (
                                        <span className="text-slate-500 text-sm">None!</span>
                                    )}
                                </div>
                            </div>

                            {/* Resistances */}
                            <div>
                                <h3 className="text-green-400 font-medium mb-2">Resistances</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(typeCoverage.resistances).map(([type, count]) => (
                                        <span key={type} className={`type-badge type-${type.toLowerCase()} text-xs px-2 py-1 relative`}>
                                            {type}
                                            {count > 1 && (
                                                <span className="absolute -top-2 -right-2 bg-green-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                                    {count}
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Immunities */}
                            <div>
                                <h3 className="text-blue-400 font-medium mb-2">Immunities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(typeCoverage.immunities).map(([type, count]) => (
                                        <span key={type} className={`type-badge type-${type.toLowerCase()} text-xs px-2 py-1 relative`}>
                                            {type}
                                            {count > 1 && (
                                                <span className="absolute -top-2 -right-2 bg-blue-500 text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                                    {count}
                                                </span>
                                            )}
                                        </span>
                                    ))}
                                    {Object.keys(typeCoverage.immunities).length === 0 && (
                                        <span className="text-slate-500 text-sm">None</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {team.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-lg mb-2">Your team is empty!</p>
                        <p>Start by searching for Pokémon to add to your team above.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
