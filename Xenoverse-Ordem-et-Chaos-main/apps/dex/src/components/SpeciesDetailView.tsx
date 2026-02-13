
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
    'level_up': 'By Leveling Up',
    'tm': 'By TM/HM',
    'hm': 'By TM/HM',
    'tutor': 'By Move Tutor',
    'egg': 'By Breeding',
    'breeding': 'By Breeding',
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

    // Initialize active method
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

    const learnMethods = useMemo(() => Object.keys(groupedMoves), [groupedMoves]);

    const statMax = 255;
    const statBar = (value: number, label: string, color: string) => (
        <div className="flex items-center gap-2 mb-2">
            <span className="w-20 text-sm text-gray-400">{label}</span>
            <span className="w-10 text-right font-mono text-sm">{value}</span>
            <div className="flex-1 bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${(value / statMax) * 100}%` }}></div>
            </div>
        </div>
    );

    const genderInfo = species.gender_ratio ? genderRatioDisplay[species.gender_ratio] : null;
    const heightM = species.height ? (species.height / 10).toFixed(1) : null;
    const weightKg = species.weight ? (species.weight / 10).toFixed(1) : null;
    const getFormShortName = (formId: number): string => XENOVERSE_FORM_SHORT_NAMES[formId] || `Form ${formId}`;

    return (
        <div className="h-full overflow-auto">
            {/* Navigation Header */}
            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3 mb-4">
                <Link
                    href={adjacent.prev ? `/species/${adjacent.prev.id}${adjacent.prev.form_id > 0 ? `?form=${adjacent.prev.form_id}` : ''}` : '#'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${adjacent.prev ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'}`}
                    onClick={(e) => !adjacent.prev && e.preventDefault()}
                >
                    <span>←</span>
                    <span className="hidden sm:inline">{adjacent.prev?.name || 'None'}</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm">← Dex</Link>
                </div>
                <Link
                    href={adjacent.next ? `/species/${adjacent.next.id}${adjacent.next.form_id > 0 ? `?form=${adjacent.next.form_id}` : ''}` : '#'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${adjacent.next ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'}`}
                    onClick={(e) => !adjacent.next && e.preventDefault()}
                >
                    <span className="hidden sm:inline">{adjacent.next?.name || 'None'}</span>
                    <span>→</span>
                </Link>
            </div>

            {/* Main Header Card */}
            <div className="bg-gray-900 rounded-lg overflow-hidden mb-4">
                {forms.length > 1 && (
                    <div className="flex border-b border-gray-800 overflow-x-auto bg-gray-950">
                        {forms.map((form) => (
                            <button
                                key={form.id}
                                onClick={() => router.push(`/species/${form.id}`)}
                                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${form.id === species.id ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                            >{form.form_id === 0 ? 'Base' : (form.display_form_name || `Form ${form.form_id}`)}</button>
                        ))}
                    </div>
                )}

                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex flex-col items-center">
                            <div className="bg-gray-800 rounded-lg cursor-pointer relative group" onClick={() => setShowShiny(!showShiny)} title="Click to toggle shiny">
                                {(showShiny ? species.front_shiny_path : species.front_path) ? (
                                    <SpriteDisplay
                                        src={`/api/asset?path=${encodeURIComponent(showShiny ? species.front_shiny_path! : species.front_path!)}`}
                                        alt={species.name}
                                        size={192}
                                        className="rounded-lg"
                                    />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center"><span className="text-gray-600 text-4xl">?</span></div>
                                )}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-gray-900/80 px-2 py-1 rounded text-xs">{showShiny ? '✨ Shiny' : 'Normal'}</span>
                                </div>
                            </div>

                            <button onClick={() => setShowShiny(!showShiny)} className={`mt-2 px-3 py-1 text-xs rounded-full transition ${showShiny ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                {showShiny ? '✨ Shiny' : 'Normal'}
                            </button>

                            {/* Inherited assets indicator */}
                            {species.assets_inherited && (
                                <div className="mt-2 px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded" title="Using base form sprite">
                                    📦 Base form sprite
                                </div>
                            )}

                            {species.cry_path && (
                                <div className="mt-4 flex flex-col items-center gap-2">
                                    <audio controls preload="metadata" className="w-48 h-8" src={`/api/asset?path=${encodeURIComponent(species.cry_path)}`} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <div className="mb-3">
                                {species.dex_number && <span className="text-gray-500 text-sm">#{String(species.dex_number).padStart(3, '0')}</span>}
                                <h1 className="text-3xl font-bold flex items-center gap-3">{species.name}</h1>
                                {species.category && <p className="text-gray-400 italic text-sm">{species.category} Pokémon</p>}
                            </div>

                            <div className="flex gap-2 mb-4">
                                {species.type1 && <Link href={`/?types=${species.type1}&typeMatch=any`} className={`type-badge type-${species.type1.toLowerCase()} text-base px-4 py-1 hover:opacity-80 transition`}>{species.type1}</Link>}
                                {species.type2 && <Link href={`/?types=${species.type2}&typeMatch=any`} className={`type-badge type-${species.type2.toLowerCase()} text-base px-4 py-1 hover:opacity-80 transition`}>{species.type2}</Link>}
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                {heightM && (
                                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase mb-1">Height</div>
                                        <div className="text-lg font-semibold">{heightM} m</div>
                                    </div>
                                )}
                                {weightKg && (
                                    <div className="bg-gray-800 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-500 uppercase mb-1">Weight</div>
                                        <div className="text-lg font-semibold">{weightKg} kg</div>
                                    </div>
                                )}
                            </div>

                            {/* Abilities */}
                            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                                <h3 className="text-xs text-gray-500 uppercase mb-2 font-semibold">Abilities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {species.ability1 && (
                                        <span className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-full">
                                            {species.ability1}
                                        </span>
                                    )}
                                    {species.ability2 && (
                                        <span className="px-3 py-1 bg-gray-700 text-gray-200 text-sm rounded-full">
                                            {species.ability2}
                                        </span>
                                    )}
                                    {species.hidden_ability && (
                                        <span className="px-3 py-1 bg-purple-900/50 text-purple-300 text-sm rounded-full" title="Hidden Ability">
                                            ✨ {species.hidden_ability}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {typeEffectiveness && (
                                <div className="lg:w-full bg-gray-800/50 rounded-lg p-4 mt-4">
                                    <h3 className="text-xs text-gray-500 uppercase mb-3 font-semibold">Type Effectiveness</h3>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                                        {typeEffectiveness.weak.length > 0 && (
                                            <div className="flex gap-2 items-center"><span className="text-red-400 text-xs font-bold">Weak:</span>
                                                <div className="flex gap-1">{typeEffectiveness.weak.map(t => <span key={t} className="text-xs bg-gray-700 px-1 rounded">{t}</span>)}</div>
                                            </div>
                                        )}
                                        {typeEffectiveness.resist.length > 0 && (
                                            <div className="flex gap-2 items-center"><span className="text-green-400 text-xs font-bold">Resist:</span>
                                                <div className="flex gap-1">{typeEffectiveness.resist.map(t => <span key={t} className="text-xs bg-gray-700 px-1 rounded">{t}</span>)}</div>
                                            </div>
                                        )}
                                        {typeEffectiveness.immune.length > 0 && (
                                            <div className="flex gap-2 items-center"><span className="text-purple-400 text-xs font-bold">Immune:</span>
                                                <div className="flex gap-1">{typeEffectiveness.immune.map(t => <span key={t} className="text-xs bg-gray-700 px-1 rounded">{t}</span>)}</div>
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
            <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex border-b border-gray-800 overflow-x-auto">
                    {(['stats', 'data', 'moves', 'evolutions', 'locations', ...(forms.length > 1 ? ['forms'] : [])] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as string)}
                            className={`px-6 py-3 text-sm font-medium capitalize whitespace-nowrap transition ${activeTab === tab ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
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
                        <div className="max-w-lg">
                            {statBar(species.hp, 'HP', 'bg-red-500')}
                            {statBar(species.attack, 'Attack', 'bg-orange-500')}
                            {statBar(species.defense, 'Defense', 'bg-yellow-500')}
                            {statBar(species.special_attack, 'Sp. Atk', 'bg-blue-500')}
                            {statBar(species.special_defense, 'Sp. Def', 'bg-green-500')}
                            {statBar(species.speed, 'Speed', 'bg-pink-500')}
                            <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between">
                                <span className="text-gray-400">Total</span>
                                <span className="font-bold text-2xl">{species.bst}</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'locations' && (
                        encounters.length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <EncounterTable encounters={encounters} />
                                </div>
                                <div className="lg:col-span-1">
                                    <h4 className="text-sm text-gray-400 mb-2 uppercase font-bold">Region Map</h4>
                                    <div className="space-y-4">
                                        {Array.from(new Set(encounters.map(e => e.map_name))).slice(0, 3).map(mapName => (
                                            <RegionMap key={mapName} mapName={mapName} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : <div className="text-center py-8 text-gray-500">No known locations</div>
                    )}

                    {activeTab === 'moves' && (
                        <div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {learnMethods.map(method => (
                                    <button key={method} onClick={() => setActiveLearnMethod(method)}
                                        className={`px-4 py-2 rounded-lg text-sm transition ${activeLearnMethod === method ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                                        {learnMethodNames[method] || method}
                                    </button>
                                ))}
                            </div>

                            {activeLearnMethod && groupedMoves[activeLearnMethod] && (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-400"><th>Lv</th><th>Name</th><th>Type</th><th>Cat</th><th>Pwr</th></tr>
                                    </thead>
                                    <tbody>
                                        {groupedMoves[activeLearnMethod].map((move, i) => (
                                            <tr key={i} className="border-b border-gray-800">
                                                <td className="py-2">{move.level}</td>
                                                <td>{move.move_name}</td>
                                                <td><span className={`type-badge type-${move.move_type?.toLowerCase()} text-xs`}>{move.move_type}</span></td>
                                                <td>{move.move_category}</td>
                                                <td>{move.power_display}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'evolutions' && (
                        <div className="flex flex-wrap gap-4">
                            {evolutions.map((evo, i) => (
                                <Link key={i} href={`/species/${evo.target_id}?form=${evo.target_form}`} className="p-4 bg-gray-800 rounded hover:bg-gray-700">
                                    <div>{evo.target_id}</div>
                                    <div className="text-sm text-gray-400">
                                        {evo.method} {evo.parameter ? `(${evo.parameter})` : ''}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {activeTab === 'forms' && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {forms.map((form) => (
                                <Link
                                    key={form.id}
                                    href={`/species/${form.id}${form.form_id > 0 ? `?form=${form.form_id}` : ''}`}
                                    className={`p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-center ${form.id === species.id ? 'ring-2 ring-blue-500' : ''}`}
                                >
                                    <div className="w-16 h-16 mx-auto mb-2 bg-gray-900/50 rounded-lg flex items-center justify-center">
                                        {form.icon_path ? (
                                            <img src={`/${form.icon_path}`} alt={form.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-2xl font-bold text-gray-500">{form.name.charAt(0)}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-sm">{form.name}</div>
                                    <div className="text-xs text-gray-400">
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
