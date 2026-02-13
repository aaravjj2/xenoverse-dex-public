import { getItem, getItemLocations, POCKET_NAMES } from '@/lib/db/items';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
    params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: Props) {
    const { id } = await params;

    const item = getItem(id.toUpperCase());

    if (!item) {
        notFound();
    }

    const locations = getItemLocations(id.toUpperCase());

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600/20 via-yellow-500/20 to-amber-600/20 border-b border-amber-500/30">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <Link href="/items" className="text-amber-400 hover:text-amber-300 text-sm mb-4 inline-block">
                        ← Back to Items
                    </Link>
                    <h1 className="text-4xl font-bold text-amber-100 mb-2">{item.name}</h1>
                    <span className="text-xs px-3 py-1 bg-amber-900/50 text-amber-300 rounded-full">
                        {POCKET_NAMES[item.pocket] || 'Unknown'}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Description */}
                <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 mb-6">
                    <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
                    <p className="text-gray-300">{item.description}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-amber-300">₽{item.price.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Buy Price</div>
                    </div>
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-green-300">₽{item.sellPrice.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Sell Price</div>
                    </div>
                    {item.bpPrice > 0 && (
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
                            <div className="text-2xl font-bold text-blue-300">{item.bpPrice}</div>
                            <div className="text-xs text-gray-500">BP Cost</div>
                        </div>
                    )}
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-purple-300">{item.consumable ? 'Yes' : 'No'}</div>
                        <div className="text-xs text-gray-500">Consumable</div>
                    </div>
                </div>

                {/* Flags */}
                {item.flags.length > 0 && (
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-white mb-3">Flags</h2>
                        <div className="flex flex-wrap gap-2">
                            {item.flags.map((flag, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm">
                                    {flag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Teaches Move */}
                {item.move && (
                    <div className="bg-purple-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
                        <h2 className="text-lg font-semibold text-purple-100 mb-3">Teaches Move</h2>
                        <Link
                            href={`/moves/${item.move.toLowerCase()}`}
                            className="text-purple-300 hover:text-purple-200 font-medium"
                        >
                            {item.move}
                        </Link>
                    </div>
                )}

                {/* Locations (from World Facts) */}
                {locations.length > 0 && (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-emerald-100 mb-3">
                            Locations
                            <span className="ml-2 text-xs text-emerald-400/60 font-normal">(Layer B: Derived)</span>
                        </h2>
                        <div className="space-y-3">
                            {locations.map((loc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                                    <div>
                                        <div className="font-medium text-emerald-200">{loc.mapName}</div>
                                        <div className="text-xs text-gray-500">
                                            {loc.type === 'item_location' && 'Item Pickup'}
                                            {loc.type === 'hidden_item' && 'Hidden Item'}
                                            {loc.type === 'shop' && 'Shop'}
                                        </div>
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
