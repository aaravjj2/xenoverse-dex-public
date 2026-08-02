
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SpriteDisplay from './SpriteDisplay';
import EncounterTable from './EncounterTable';
import RegionMap from './RegionMap';
import {
    SpeciesWithAssets,
    EncounterEntry,
    LearnsetEntry,
    TypeFull
} from '@/lib/db';

interface Evolution {
    target_id: string;
    target_form: number;
    method: string;
    parameter: string | number | null;
}

interface AdjacentSpecies {
    id: string;
    form_id: number;
    name: string;
    icon_path?: string | null;
}

interface FormInfo {
    id: string;
    form_id: number;
    name: string;
    form_name: string | null;
    display_form_name: string;
    icon_path: string | null;
}

import { DefensiveEffectiveness } from '@/lib/typeUtils';

interface SpeciesDetailViewProps {
    species: SpeciesWithAssets & { assets_inherited?: boolean };
    evolutions: Evolution[];
    learnset: LearnsetEntry[];
    learnsetSource: 'form' | 'base' | 'none';
    adjacent: { prev: AdjacentSpecies | null; next: AdjacentSpecies | null };
    typeEffectiveness: DefensiveEffectiveness | null;
    forms: FormInfo[];
    encounters: EncounterEntry[];
    initialView?: string;
    initialForm?: string;
}

const XENOVERSE_FORM_SHORT_NAMES: Record<number, string> = {
    0: 'Base',
    1: 'Terrestrial',
    2: 'Xenoversal',
    3: 'Astral',
};

const genderRatioDisplay: Record<string, { male: number; female: number; label: string }> = {
    'AlwaysMale': { male: 100, female: 0, label: '100% ♂' },
    'FemaleOneEighth': { male: 87.5, female: 12.5, label: '87.5% ♂ / 12.5% ♀' },
    'Female25Percent': { male: 75, female: 25, label: '75% ♂ / 25% ♀' },
    'Female50Percent': { male: 50, female: 50, label: '50% ♂ / 50% ♀' },
    'Female75Percent': { male: 25, female: 75, label: '25% ♂ / 75% ♀' },
    'FemaleSevenEighths': { male: 12.5, female: 87.5, label: '12.5% ♂ / 87.5% ♀' },
    'AlwaysFemale': { male: 0, female: 100, label: '100% ♀' },
    'Genderless': { male: 0, female: 0, label: 'Genderless' },
};

const learnMethodNames: Record<string, string> = {
    'level_up': 'Level Up',
    'tm': 'TM/HM',
    'hm': 'TM/HM',
    'tutor': 'Move Tutor',
    'egg': 'Egg Move',
    'breeding': 'Breeding',
};

const statColors: Record<string, string> = {
    hp: 'from-red-500 to-rose-600',
    attack: 'from-orange-500 to-amber-600',
    defense: 'from-yellow-500 to-amber-500',
    special_attack: 'from-blue-500 to-indigo-600',
    special_defense: 'from-green-500 to-emerald-600',
    speed: 'from-pink-500 to-fuchsia-600',
};

export default function SpeciesDetailView({
    species,
    evolutions,
    learnset,
    learnsetSource,
    adjacent,
    typeEffectiveness,
    forms,
    encounters,
    initialView = 'stats'
}: SpeciesDetailViewProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(initialView);
    const [showShiny, setShowShiny] = useState(false);
    const [activeLearnMethod, setActiveLearnMethod] = useState<string | null>(null);

    useEffect(() => {
        if (learnset.length > 0 && !activeLearnMethod) {
            const methods = Array.from(new Set(learnset.map(m => m.learn_method)));
            if (methods.includes('level_up')) {
                setActiveLearnMethod('level_up');
            } else if (methods.length > 0) {
                setActiveLearnMethod(methods[0]);
            }
        }
    }, [learnset, activeLearnMethod]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && adjacent.prev) {
                const formParam = adjacent.prev.form_id > 0 ? `?form=${adjacent.prev.form_id}` : '';
                router.push(`/species/${adjacent.prev.id}${formParam}`);
            } else if (e.key === 'ArrowRight' && adjacent.next) {
                const formParam = adjacent.next.form_id > 0 ? `?form=${adjacent.next.form_id}` : '';
                router.push(`/species/${adjacent.next.id}${formParam}`);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [adjacent, router]);

    const groupedMoves = useMemo(() => {
        return learnset.reduce((acc, move) => {
            if (!acc[move.learn_method]) acc[move.learn_method] = [];
            acc[move.learn_method].push(move);
            return acc;
        }, {} as Record<string, LearnsetEntry[]>);
    }, [learnset]);

    const learnMethods = useMemo(() => {
        const methods = Object.keys(groupedMoves);
        const preferredOrder = ['level_up', 'breeding', 'egg'];
        return methods.sort((a, b) => {
            const aIndex = preferredOrder.indexOf(a);
            const bIndex = preferredOrder.indexOf(b);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [groupedMoves]);

    const genderInfo = species.gender_ratio ? genderRatioDisplay[species.gender_ratio] : null;
    const heightM = species.height ? (species.height / 10).toFixed(1) : null;
    const weightKg = species.weight ? (species.weight / 10).toFixed(1) : null;

    const StatBar = ({ value, label, color, delay }: { value: number; label: string; color: string; delay: number }) => (
        <div className="flex items-center gap-3 mb-2.5 group">
            <span className="w-10 text-xs text-slate-400 font-medium">{label}</span>
            <span className="w-10 text-right font-mono text-sm font-bold text-slate-200 tabular-nums">{value}</span>
            <div className="flex-1 h-3 bg-slate-800/80 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${color} rounded-full animate-stat-fill`}
                    style={{ width: `${(value / 255) * 100}%`, animationDelay: `${delay}ms` }}
                />
            </div>
        </div>
    );

    const tabs = ['stats', 'data', 'moves', 'evolutions', 'locations', ...(forms.length > 1 ? ['forms'] : [])];

    return (
        <div className="h-full overflow-auto animate-fade-in">
            {/* Navigation Header */}
            <div className="glass-card !rounded-2xl p-3 mb-5 flex items-center justify-between">
                <Link
                    href={adjacent.prev ? `/species/${adjacent.prev.id}${adjacent.prev.form_id > 0 ? `?form=${adjacent.prev.form_id}` : ''}` : '#'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${adjacent.prev ? 'bg-slate-800/50 hover:bg-slate-700/50 text-white border border-[var(--border-subtle)]' : 'bg-slate-800/20 text-slate-600 cursor-not-allowed'}`}
                    onClick={(e) => !adjacent.prev && e.preventDefault()}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    <span className="hidden sm:inline text-sm">{adjacent.prev?.name || 'None'}</span>
                </Link>
                <Link href="/" className="text-sm text-slate-400 hover:text-blue-400 transition-colors font-medium">
                    ← Pokédex
                </Link>
                <Link
                    href={adjacent.next ? `/species/${adjacent.next.id}${adjacent.next.form_id > 0 ? `?form=${adjacent.next.form_id}` : ''}` : '#'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${adjacent.next ? 'bg-slate-800/50 hover:bg-slate-700/50 text-white border border-[var(--border-subtle)]' : 'bg-slate-800/20 text-slate-600 cursor-not-allowed'}`}
                    onClick={(e) => !adjacent.next && e.preventDefault()}
                >
                    <span className="hidden sm:inline text-sm">{adjacent.next?.name || 'None'}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
            </div>

            {/* Main Header Card */}
            <div className="glass-card !rounded-2xl overflow-hidden mb-5">
                {/* Form Tabs */}
                {forms.length > 1 && (
                    <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto bg-slate-900/50">
                        {forms.map((form) => (
                            <button
                                key={form.id}
                                onClick={() => router.push(`/species/${form.id}`)}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all ${form.id === species.id
                                    ? 'bg-slate-800/50 text-white border-b-2 border-blue-500'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'}`}
                            >{form.form_id === 0 ? 'Base' : (form.display_form_name || `Form ${form.form_id}`)}</button>
                        ))}
                    </div>
                )}

                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sprite Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 cursor-pointer group border border-[var(--border-subtle)] hover:border-blue-500/30 transition-all"
                                onClick={() => setShowShiny(!showShiny)}
                            >
                                {(showShiny ? species.front_shiny_path : species.front_path) ? (
                                    <SpriteDisplay
                                        src={`/api/asset?path=${encodeURIComponent(showShiny ? species.front_shiny_path! : species.front_path!)}`}
                                        alt={species.name}
                                        size={192}
                                        className="rounded-lg"
                                    />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center"><span className="text-slate-600 text-5xl">?</span></div>
                                )}
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-slate-900/90 px-2.5 py-1 rounded-lg text-xs border border-[var(--border-subtle)]">{showShiny ? '✨ Shiny' : 'Normal'}</span>
                                </div>
                            </div>

                            <button onClick={() => setShowShiny(!showShiny)} className={`px-4 py-1.5 text-xs rounded-full font-medium transition-all ${showShiny ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300 border border-[var(--border-subtle)] hover:bg-slate-700'}`}>
                                {showShiny ? '✨ Shiny' : '☆ Normal'}
                            </button>

                            {species.assets_inherited && (
                                <div className="px-3 py-1.5 bg-amber-900/30 text-amber-300/80 text-xs rounded-lg border border-amber-500/20">
                                    📦 Base form sprite
                                </div>
                            )}

                            {species.cry_path && (
                                <audio controls preload="metadata" className="w-48 h-8 opacity-80 hover:opacity-100 transition-opacity" src={`/api/asset?path=${encodeURIComponent(species.cry_path)}`} />
                            )}
                        </div>

                        {/* Info Section */}
                        <div className="flex-1 space-y-5">
                            {/* Name & Classification */}
                            <div>
                                {species.dex_number && <span className="text-slate-500 font-mono text-sm font-bold">#{String(species.dex_number).padStart(3, '0')}</span>}
                                <h1 className="text-3xl font-bold text-white mt-1">{species.name}</h1>
                                {species.category && <p className="text-slate-400 italic text-sm mt-1">{species.category} Pokémon</p>}
                            </div>

                            {/* Types */}
                            <div className="flex gap-2">
                                {species.type1 && <Link href={`/?types=${species.type1}&typeMatch=any`} className={`type-badge type-${species.type1.toLowerCase()} text-sm px-4 py-1.5 hover:opacity-80 transition`}>{species.type1}</Link>}
                                {species.type2 && <Link href={`/?types=${species.type2}&typeMatch=any`} className={`type-badge type-${species.type2.toLowerCase()} text-sm px-4 py-1.5 hover:opacity-80 transition`}>{species.type2}</Link>}
                            </div>

                            {/* Physical Data */}
                            {(heightM || weightKg || genderInfo) && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {heightM && (
                                        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-[var(--border-subtle)]">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Height</div>
                                            <div className="text-lg font-bold text-slate-200">{heightM} <span className="text-xs text-slate-400">m</span></div>
                                        </div>
                                    )}
                                    {weightKg && (
                                        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-[var(--border-subtle)]">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Weight</div>
                                            <div className="text-lg font-bold text-slate-200">{weightKg} <span className="text-xs text-slate-400">kg</span></div>
                                        </div>
                                    )}
                                    {genderInfo && (
                                        <div className="bg-slate-800/50 rounded-xl p-3 text-center border border-[var(--border-subtle)]">
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Gender</div>
                                            <div className="text-sm font-bold text-slate-200">{genderInfo.label}</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Abilities */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-[var(--border-subtle)]">
                                <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-bold">Abilities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {species.ability1 && (
                                        <Link href={`/abilities/${species.ability1.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-slate-700/50 text-slate-200 text-sm rounded-lg hover:bg-slate-600/50 transition border border-[var(--border-subtle)]">
                                            {species.ability1}
                                        </Link>
                                    )}
                                    {species.ability2 && (
                                        <Link href={`/abilities/${species.ability2.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-slate-700/50 text-slate-200 text-sm rounded-lg hover:bg-slate-600/50 transition border border-[var(--border-subtle)]">
                                            {species.ability2}
                                        </Link>
                                    )}
                                    {species.hidden_ability && (
                                        <Link href={`/abilities/${species.hidden_ability.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-1.5 bg-purple-900/30 text-purple-300 text-sm rounded-lg hover:bg-purple-800/40 transition border border-purple-500/20">
                                            ✨ {species.hidden_ability}
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Type Effectiveness */}
                            {typeEffectiveness && (
                                <div className="bg-slate-800/30 rounded-xl p-4 border border-[var(--border-subtle)]">
                                    <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-bold">Type Effectiveness</h3>
                                    <div className="space-y-2">
                                        {typeEffectiveness.weak.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-red-400 font-bold uppercase w-14">Weak</span>
                                                <div className="flex flex-wrap gap-1">{typeEffectiveness.weak.map(t => <span key={t} className="type-badge type-{t.toLowerCase()} text-[10px] px-2 py-0.5">{t}</span>)}</div>
                                            </div>
                                        )}
                                        {typeEffectiveness.resist.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-green-400 font-bold uppercase w-14">Resist</span>
                                                <div className="flex flex-wrap gap-1">{typeEffectiveness.resist.map(t => <span key={t} className="type-badge type-{t.toLowerCase()} text-[10px] px-2 py-0.5">{t}</span>)}</div>
                                            </div>
                                        )}
                                        {typeEffectiveness.immune.length > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-purple-400 font-bold uppercase w-14">Immune</span>
                                                <div className="flex flex-wrap gap-1">{typeEffectiveness.immune.map(t => <span key={t} className="type-badge type-{t.toLowerCase()} text-[10px] px-2 py-0.5">{t}</span>)}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="glass-card !rounded-2xl overflow-hidden">
                <div className="flex border-b border-[var(--border-subtle)] overflow-x-auto bg-slate-900/30">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as string)}
                            className={`px-5 py-3.5 text-sm font-medium capitalize whitespace-nowrap transition-all ${activeTab === tab
                                ? 'text-white border-b-2 border-blue-500 bg-slate-800/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/20'}`}
                        >
                            {tab === 'moves' ? `Learnset (${learnset.length})` :
                                tab === 'evolutions' ? `Evolution (${evolutions.length})` :
                                    tab === 'locations' ? `Locations (${encounters.length})` :
                                        tab === 'forms' ? `Forms (${forms.length})` : tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'stats' && (
                        <div className="max-w-lg animate-fade-in">
                            <StatBar value={species.hp} label="HP" color={statColors.hp} delay={0} />
                            <StatBar value={species.attack} label="ATK" color={statColors.attack} delay={50} />
                            <StatBar value={species.defense} label="DEF" color={statColors.defense} delay={100} />
                            <StatBar value={species.special_attack} label="SpA" color={statColors.special_attack} delay={150} />
                            <StatBar value={species.special_defense} label="SpD" color={statColors.special_defense} delay={200} />
                            <StatBar value={species.speed} label="SPE" color={statColors.speed} delay={250} />
                            <div className="border-t border-[var(--border-subtle)] mt-4 pt-4 flex justify-between items-center">
                                <span className="text-sm text-slate-400 font-medium">Base Stat Total</span>
                                <span className="text-2xl font-bold text-gradient">{species.bst}</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'data' && (
                        <div className="animate-fade-in max-w-2xl">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {species.egg_group1 && (
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-[var(--border-subtle)]">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Egg Group 1</div>
                                        <div className="font-medium">{species.egg_group1}</div>
                                    </div>
                                )}
                                {species.egg_group2 && (
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-[var(--border-subtle)]">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Egg Group 2</div>
                                        <div className="font-medium">{species.egg_group2}</div>
                                    </div>
                                )}
                                {species.base_happiness !== null && (
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-[var(--border-subtle)]">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Base Happiness</div>
                                        <div className="font-medium">{species.base_happiness}</div>
                                    </div>
                                )}
                                {species.catch_rate !== null && (
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-[var(--border-subtle)]">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Catch Rate</div>
                                        <div className="font-medium">{species.catch_rate}</div>
                                    </div>
                                )}
                                {species.growth_rate && (
                                    <div className="bg-slate-800/50 rounded-xl p-4 border border-[var(--border-subtle)]">
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Growth Rate</div>
                                        <div className="font-medium">{species.growth_rate}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'locations' && (
                        <div className="animate-fade-in">
                            {encounters.length > 0 ? (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2">
                                        <EncounterTable encounters={encounters} />
                                    </div>
                                    <div className="lg:col-span-1">
                                        <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-bold">Region Map</h4>
                                        <div className="space-y-4">
                                            {Array.from(new Set(encounters.map(e => e.map_name))).slice(0, 3).map(mapName => (
                                                <RegionMap key={mapName} mapName={mapName} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : <div className="text-center py-12 text-slate-500">No known locations</div>}
                        </div>
                    )}

                    {activeTab === 'moves' && (
                        <div className="animate-fade-in">
                            <div className="flex flex-wrap gap-2 mb-5">
                                {learnMethods.map(method => (
                                    <button key={method} onClick={() => setActiveLearnMethod(method)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeLearnMethod === method ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-[var(--border-subtle)]'}`}>
                                        {learnMethodNames[method] || method}
                                    </button>
                                ))}
                            </div>

                            {activeLearnMethod && groupedMoves[activeLearnMethod] && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-[10px] text-slate-500 uppercase tracking-wider border-b border-[var(--border-subtle)]">
                                                <th className="text-left py-3 px-3">Lv</th>
                                                <th className="text-left py-3 px-3">Name</th>
                                                <th className="text-left py-3 px-3">Type</th>
                                                <th className="text-left py-3 px-3">Cat</th>
                                                <th className="text-right py-3 px-3">Pwr</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groupedMoves[activeLearnMethod].map((move, i) => (
                                                <tr key={i} className="border-b border-[var(--border-subtle)] hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-2.5 px-3 font-mono text-slate-300">{move.level}</td>
                                                    <td className="py-2.5 px-3 font-medium text-white">{move.move_name}</td>
                                                    <td className="py-2.5 px-3"><span className={`type-badge type-${move.move_type?.toLowerCase()} text-[10px] px-2 py-0.5`}>{move.move_type}</span></td>
                                                    <td className="py-2.5 px-3 text-slate-400">{move.move_category}</td>
                                                    <td className="py-2.5 px-3 text-right font-mono text-slate-300">{move.power_display}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'evolutions' && (
                        <div className="animate-fade-in">
                            {evolutions.length > 0 ? (
                                <div className="flex flex-wrap gap-4">
                                    {evolutions.map((evo, i) => (
                                        <Link key={i} href={`/species/${evo.target_id}?form=${evo.target_form}`} className="glass-card p-4 group/evo hover:border-blue-500/30">
                                            <div className="font-bold text-white group-hover/evo:text-blue-400 transition-colors">{evo.target_id}</div>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {evo.method} {evo.parameter ? `(${evo.parameter})` : ''}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500">No evolutions</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'forms' && (
                        <div className="animate-fade-in grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {forms.map((form) => (
                                <Link
                                    key={form.id}
                                    href={`/species/${form.id}${form.form_id > 0 ? `?form=${form.form_id}` : ''}`}
                                    className={`glass-card p-4 text-center ${form.id === species.id ? '!border-blue-500/50 shadow-glow-blue' : ''}`}
                                >
                                    <div className="w-16 h-16 mx-auto mb-3 bg-slate-900/50 rounded-xl flex items-center justify-center">
                                        {form.icon_path ? (
                                            <img src={`/${form.icon_path}`} alt={form.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-2xl font-bold text-slate-500">{form.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-sm text-white">{form.name}</div>
                                    <div className="text-xs text-slate-400 mt-0.5">
                                        {form.form_name || form.display_form_name || (form.form_id === 0 ? 'Base' : `Form ${form.form_id}`)}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
