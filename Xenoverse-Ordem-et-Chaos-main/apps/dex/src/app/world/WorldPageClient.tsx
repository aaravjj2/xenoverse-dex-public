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
        <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Provenance</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            <div className="p-4 space-y-4">
                {/* Type & Confidence */}
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${fact.type === 'item_location' ? 'bg-amber-900/50 text-amber-300' :
                        fact.type === 'shop' ? 'bg-blue-900/50 text-blue-300' :
                            fact.type === 'trainer_location' ? 'bg-red-900/50 text-red-300' :
                                fact.type === 'hidden_item' ? 'bg-purple-900/50 text-purple-300' :
                                    fact.type === 'wild_encounter' ? 'bg-emerald-900/50 text-emerald-300' :
                                        fact.type === 'gift_pokemon' ? 'bg-pink-900/50 text-pink-300' :
                                            fact.type === 'static_encounter' ? 'bg-orange-900/50 text-orange-300' :
                                                'bg-gray-700 text-gray-300'
                        }`}>
                        {fact.type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${fact.confidence === 'high' ? 'bg-green-900/50 text-green-300' :
                        fact.confidence === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                            'bg-red-900/50 text-red-300'
                        }`}>
                        {fact.confidence}
                    </span>
                </div>

                {/* Location */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <h3 className="text-xs text-gray-500 uppercase mb-2">Location</h3>

                    {/* Contextual Map */}
                    <div className="mb-3">
                        <RegionMap mapName={fact.mapName} className="w-full" />
                    </div>

                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Map</span>
                            <span className="text-white">{fact.mapName || `Map ${fact.mapId}`}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Map ID</span>
                            <span className="text-white">{fact.mapId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Event ID</span>
                            <span className="text-white">{fact.eventId ?? 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Page Index</span>
                            <span className="text-white">{fact.pageIndex ?? 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Command Index</span>
                            <span className="text-white">{fact.commandIndex ?? 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Payload */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                    <h3 className="text-xs text-gray-500 uppercase mb-2">Payload</h3>
                    <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(fact.payload, null, 2)}
                    </pre>

                    {/* Links to canonical entities */}
                    {(fact.payload.species || fact.payload.pokemonId) && (
                        <Link
                            href={`/pokemon/${(fact.payload.species || fact.payload.pokemonId).toLowerCase()}`}
                            className="mt-2 block text-xs text-emerald-400 hover:text-emerald-300"
                        >
                            → View Pokémon: {fact.payload.species || fact.payload.pokemonId}
                        </Link>
                    )}
                    {fact.payload.itemId && (
                        <Link
                            href={`/items/${fact.payload.itemId.toLowerCase()}`}
                            className="mt-2 block text-xs text-amber-400 hover:text-amber-300"
                        >
                            → View Item: {fact.payload.itemId}
                        </Link>
                    )}
                    {fact.payload.trainerId && (
                        <Link
                            href={`/trainers/${encodeURIComponent(fact.payload.trainerId)}`}
                            className="mt-2 block text-xs text-red-400 hover:text-red-300"
                        >
                            → View Trainer: {fact.payload.trainerName || fact.payload.trainerId}
                        </Link>
                    )}
                </div>

                {/* Conditions */}
                {fact.conditions && Object.keys(fact.conditions).length > 0 && (
                    <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-3">
                        <h3 className="text-xs text-yellow-500 uppercase mb-2">Conditions</h3>
                        <pre className="text-xs text-yellow-300 overflow-x-auto">
                            {JSON.stringify(fact.conditions, null, 2)}
                        </pre>
                    </div>
                )}

                {/* Copy Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => copyToClipboard(provenanceText, 'provenance')}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                    >
                        {copied === 'provenance' ? '✓ Copied!' : 'Copy Provenance'}
                    </button>
                </div>
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

    // Check filters
    const hasActiveFilters = searchParams.has('q') || searchParams.has('type') || searchParams.has('confidence');

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-emerald-950/20 to-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600/20 via-teal-500/20 to-emerald-600/20 border-b border-emerald-500/30">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">🗺️</span>
                        <div>
                            <h1 className="text-4xl font-bold text-emerald-100">Eldiw Region</h1>
                            <p className="text-emerald-200/80 text-sm mt-1">
                                Interactive map of the Pokémon Xenoverse world. Click any location marker to explore, or browse the world data below.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Global Map View Only */}
                <div className="mb-8">
                    <InteractiveWorldMap className="w-full max-w-5xl mx-auto border-4 border-emerald-500/30 shadow-2xl" />
                </div>
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
