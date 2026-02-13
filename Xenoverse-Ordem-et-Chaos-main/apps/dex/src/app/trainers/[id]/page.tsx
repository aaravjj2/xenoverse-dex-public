import { getTrainer, getTrainerLocations } from '@/lib/db/trainers';
import SpeciesIcon from '@/components/SpeciesIcon';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function TrainerDetailPage({ params }: Props) {
    const { id } = await params;

    const trainer = getTrainer(decodeURIComponent(id));

    if (!trainer) {
        notFound();
    }

    const locations = getTrainerLocations(trainer.id);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-950/20 to-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600/20 via-orange-500/20 to-red-600/20 border-b border-red-500/30">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <Link href="/trainers" className="text-red-400 hover:text-red-300 text-sm mb-4 inline-block">
                        ← Back to Trainers
                    </Link>
                    <h1 className="text-4xl font-bold text-red-100 mb-2">{trainer.name}</h1>
                    <span className="text-xs px-3 py-1 bg-red-900/50 text-red-300 rounded-full">
                        {trainer.trainerType.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Lose Text */}
                {trainer.loseText && (
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-3">Defeat Quote</h2>
                        <p className="text-gray-300 italic">"{trainer.loseText}"</p>
                    </div>
                )}

                {/* Party */}
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Party ({trainer.partyCount} Pokémon)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {trainer.party?.map((pokemon, i) => (
                            <Link
                                key={i}
                                href={`/pokemon/${pokemon.speciesId.toLowerCase()}`}
                                className="group p-3 bg-gray-800/60 border border-gray-700/50 rounded-xl hover:border-red-500/30 hover:shadow-lg transition-all flex gap-4"
                            >
                                {/* Species Icon */}
                                <div className="shrink-0 pt-1">
                                    <SpeciesIcon
                                        name={pokemon.speciesName || pokemon.speciesId}
                                        iconPath={pokemon.iconPath || null}
                                        type1={pokemon.type1}
                                        type2={pokemon.type2}
                                        size={48}
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1.5">
                                        <span className="font-bold text-gray-200 group-hover:text-red-200 transition-colors truncate">
                                            {pokemon.speciesName || pokemon.speciesId}
                                        </span>
                                        <span className="text-xs font-mono px-1.5 py-0.5 bg-gray-900/50 text-gray-400 rounded border border-gray-600/30">
                                            Lv.{pokemon.level}
                                        </span>
                                    </div>

                                    {pokemon.item && (
                                        <div className="text-xs text-amber-400/80 mb-2 flex items-center gap-1">
                                            <span>📦</span> {pokemon.item}
                                        </div>
                                    )}

                                    {pokemon.moves.length > 0 && (
                                        <div className="text-xs text-gray-500 space-y-0.5">
                                            {pokemon.moves.map((move, j) => (
                                                <div key={j} className="truncate">• {move}</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Items */}
                {trainer.items.length > 0 && (
                    <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-amber-100 mb-3">Battle Items</h2>
                        <div className="flex flex-wrap gap-2">
                            {trainer.items.map((item, i) => (
                                <Link
                                    key={i}
                                    href={`/items/${item.toLowerCase()}`}
                                    className="px-3 py-1 bg-amber-800/50 text-amber-200 rounded-full text-sm hover:bg-amber-800 transition-colors"
                                >
                                    {item}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locations (from World Facts) */}
                {locations.length > 0 && (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-emerald-100 mb-3">
                            Battle Locations
                            <span className="ml-2 text-xs text-emerald-400/60 font-normal">(Layer B: Derived)</span>
                        </h2>
                        <div className="space-y-3">
                            {locations.map((loc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                                    <div>
                                        <div className="font-medium text-emerald-200">{loc.mapName}</div>
                                        <div className="text-xs text-gray-500">Map ID: {loc.mapId}</div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${loc.confidence === 'high' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'
                                        }`}>
                                        {loc.confidence}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
