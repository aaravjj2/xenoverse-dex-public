'use client';

import { useState } from 'react';
import Link from 'next/link';
import RegionMap from '@/components/RegionMap';
import InteractiveWorldMap from '@/components/InteractiveWorldMap';
import { useSearchParams } from 'next/navigation';

interface WorldFact {
    id: number;
    type: string;
    mapId: number;
    mapName: string | null;
    eventId: number | null;
    pageIndex: number | null;
    commandIndex: number | null;
    payload: Record<string, any>;
    confidence: string;
    reason: string | null;
    rawSnippet: string | null;
    conditions: Record<string, any> | null;
}

interface ProvenancePanelProps {
    fact: WorldFact;
    onClose: () => void;
}

function ProvenancePanel({ fact, onClose }: ProvenancePanelProps) {
    const [copied, setCopied] = useState<string | null>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const provenanceText = `Map: ${fact.mapName || fact.mapId}
Event ID: ${fact.eventId ?? 'N/A'}
Page Index: ${fact.pageIndex ?? 'N/A'}
Command Index: ${fact.commandIndex ?? 'N/A'}
Type: ${fact.type}
Confidence: ${fact.confidence}`;

    return (
        <div className="fixed inset-y-0 right-0 w-96 glass border-l border-[var(--border-subtle)] shadow-2xl z-50 overflow-y-auto bg-[var(--bg-secondary)]">
            <div className="sticky top-0 glass border-b border-[var(--border-subtle)] p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gradient">Provenance</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-xl p-1">×</button>
            </div>

            <div className="p-4 space-y-4">
                {/* Type & Confidence */}
                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${fact.type === 'item_location' ? 'bg-amber-900/30 text-amber-300 border border-amber-500/20' :
                        fact.type === 'shop' ? 'bg-blue-900/30 text-blue-300 border border-blue-500/20' :
                            fact.type === 'trainer_location' ? 'bg-red-900/30 text-red-300 border border-red-500/20' :
                                fact.type === 'hidden_item' ? 'bg-purple-900/30 text-purple-300 border border-purple-500/20' :
                                    fact.type === 'wild_encounter' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/20' :
                                        fact.type === 'gift_pokemon' ? 'bg-pink-900/30 text-pink-300 border border-pink-500/20' :
                                            fact.type === 'static_encounter' ? 'bg-orange-900/30 text-orange-300 border border-orange-500/20' :
                                                'bg-slate-800 text-slate-300 border border-[var(--border-subtle)]'
                        }`}>
                        {fact.type}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${fact.confidence === 'high' ? 'bg-green-900/30 text-green-300 border border-green-500/20' :
                        fact.confidence === 'medium' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/20' :
                            'bg-red-900/30 text-red-300 border border-red-500/20'
                        }`}>
                        {fact.confidence}
                    </span>
                </div>

                {/* Location */}
                <div className="glass-card p-4">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-bold">Location</h3>

                    <div className="mb-3">
                        <RegionMap mapName={fact.mapName} className="w-full" />
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Map</span>
                            <span className="text-white font-medium">{fact.mapName || `Map ${fact.mapId}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Map ID</span>
                            <span className="text-white font-mono">{fact.mapId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">Event ID</span>
                            <span className="text-white font-mono">{fact.eventId ?? 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Payload */}
                <div className="glass-card p-4">
                    <h3 className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-bold">Payload</h3>
                    <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap bg-slate-900/50 rounded-lg p-3 border border-[var(--border-subtle)]">
                        {JSON.stringify(fact.payload, null, 2)}
                    </pre>

                    {/* Links to canonical entities */}
                    <div className="flex flex-wrap gap-2 mt-3">
                        {(fact.payload.species || fact.payload.pokemonId) && (
                            <Link
                                href={`/pokemon/${(fact.payload.species || fact.payload.pokemonId).toLowerCase()}`}
                                className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-lg bg-emerald-900/20 border border-emerald-500/20"
                            >
                                → {fact.payload.species || fact.payload.pokemonId}
                            </Link>
                        )}
                        {fact.payload.itemId && (
                            <Link
                                href={`/items/${fact.payload.itemId.toLowerCase()}`}
                                className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg bg-amber-900/20 border border-amber-500/20"
                            >
                                → {fact.payload.itemId}
                            </Link>
                        )}
                    </div>
                </div>

                {/* Conditions */}
                {fact.conditions && Object.keys(fact.conditions).length > 0 && (
                    <div className="glass-card p-4 bg-yellow-900/10 border-yellow-500/20">
                        <h3 className="text-[10px] text-yellow-500 uppercase tracking-wider mb-2 font-bold">Conditions</h3>
                        <pre className="text-xs text-yellow-300/80 overflow-x-auto">
                            {JSON.stringify(fact.conditions, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Copy Button */}
                <button
                    onClick={() => copyToClipboard(provenanceText, 'provenance')}
                    className="w-full btn-secondary text-xs py-2.5"
                >
                    {copied === 'provenance' ? '✓ Copied!' : 'Copy Provenance'}
                </button>
            </div>
        </div>
    );
}

export default function WorldPageClient({
    initialFacts,
    total,
    types,
    stats
}: {
    initialFacts: WorldFact[];
    total: number;
    types: string[];
    stats: { type: string; count: number }[];
}) {
    const [selectedFact, setSelectedFact] = useState<WorldFact | null>(null);
    const [showMap, setShowMap] = useState(false);
    const searchParams = useSearchParams();

    const getEntityLabel = (fact: WorldFact): string => {
        if (fact.type === 'wild_encounter') {
            const p = fact.payload;
            return `${p.species} (${p.levelMin}${p.levelMax !== p.levelMin ? `-${p.levelMax}` : ''}) [${p.encounterType}] ${p.chance}%`;
        }
        if (fact.type === 'gift_pokemon') {
            return `Gift: ${fact.payload.pokemonId}${fact.payload.isEgg ? ' (Egg)' : ''}`;
        }
        if (fact.type === 'static_encounter') {
            return `Static: ${fact.payload.pokemonId} (Lvl ${fact.payload.level || '?'})`;
        }
        if (fact.payload.itemId) return fact.payload.itemId;
        if (fact.payload.trainerName) return `${fact.payload.trainerType || ''} ${fact.payload.trainerName}`.trim();
        if (fact.payload.items && Array.isArray(fact.payload.items)) {
            return `Shop (${fact.payload.items.length} items)`;
        }
        return JSON.stringify(fact.payload).slice(0, 30);
    };

    const hasActiveFilters = searchParams.has('q') || searchParams.has('type') || searchParams.has('confidence');

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="glass-card !rounded-2xl p-6 mb-6 bg-gradient-to-r from-emerald-600/10 via-teal-500/5 to-emerald-600/10 border-emerald-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-400/20">
                        <span className="text-2xl">🗺️</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gradient-emerald">Eldiw Region</h1>
                        <p className="text-emerald-200/50 text-sm mt-1">
                            Interactive map of the Pokémon Xenoverse world
                        </p>
                    </div>
                </div>
            </div>

            {/* World Map */}
            <div className="glass-card !rounded-2xl p-4 mb-6 overflow-hidden">
                <InteractiveWorldMap className="w-full max-w-5xl mx-auto rounded-xl" />
            </div>

            {/* Provenance Panel */}
            {selectedFact && (
                <ProvenancePanel
                    fact={selectedFact}
                    onClose={() => setSelectedFact(null)}
                />
            )}
        </div>
    );
}
