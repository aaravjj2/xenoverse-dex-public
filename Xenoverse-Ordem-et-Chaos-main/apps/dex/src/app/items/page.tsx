import { getItemsList, getItemsCount, POCKET_NAMES } from '@/lib/db/items';
import Link from 'next/link';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ItemsPage({ searchParams }: Props) {
    const params = await searchParams;
    const search = typeof params.search === 'string' ? params.search : '';
    const pocket = typeof params.pocket === 'string' ? parseInt(params.pocket) : undefined;
    const milestone = typeof params.milestone === 'string' ? params.milestone : undefined;
    const page = typeof params.page === 'string' ? Math.max(1, parseInt(params.page)) : 1;
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    // Get total count and items for current page
    const filterOptions = { search: search || undefined, pocket, milestone };
    const total = getItemsCount(filterOptions);
    const items = getItemsList({
        ...filterOptions,
        limit: pageSize,
        offset
    });

    const totalPages = Math.ceil(total / pageSize);
    const hasFilters = search || pocket !== undefined || milestone !== undefined;
    
    // Define milestones (major story progression points)
    const milestones = [
        { value: 'westar-gym', label: 'Westar Gym' },
        { value: 'ishtar-gym', label: 'Ishtar Gym' },
        { value: 'hadwarf-gym', label: 'Hadwarf Gym' },
        { value: 'newtron-gym', label: 'Newtron Gym' },
        { value: 'hypelion-gym', label: 'Hypelion Gym' },
        { value: 'vermillion-gym', label: 'Vermillion Gym' },
        { value: 'milkyway-gym', label: 'Milkyway Gym' },
    ];

    // Build pagination URLs
    const buildUrl = (p: number) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (pocket !== undefined) params.set('pocket', pocket.toString());
        if (milestone) params.set('milestone', milestone);
        if (p > 1) params.set('page', p.toString());
        const qs = params.toString();
        return qs ? `/items?${qs}` : '/items';
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-indigo-950 to-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-600/20 via-yellow-500/20 to-amber-600/20 border-b border-amber-500/30">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <h1 className="text-4xl font-bold text-amber-100 mb-2">Items</h1>
                    <p className="text-amber-200/70">
                        {hasFilters ? (
                            total > 0 ? (
                                <>Showing {items.length} of {total.toLocaleString()} results for "{search}"</>
                            ) : (
                                <>No results for "{search}"</>
                            )
                        ) : (
                            <>All {total.toLocaleString()} items • Xenoverse Item Database</>
                        )}
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Filters */}
                <form className="flex flex-wrap gap-3 mb-6">
                    <div className="relative flex-1 min-w-64">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" name="search" placeholder="Search items by name..." defaultValue={search}
                            className="w-full pl-11 pr-4 py-2.5 bg-gray-800/60 backdrop-blur border border-gray-700/40 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 transition-all" />
                    </div>
                    <select name="pocket" defaultValue={pocket?.toString() || ''}
                        className="px-4 py-2.5 bg-gray-800/60 backdrop-blur border border-gray-700/40 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                        <option value="">All Pockets</option>
                        {Object.entries(POCKET_NAMES).map(([value, name]) => (
                            <option key={value} value={value}>{name}</option>
                        ))}
                    </select>
                    <select name="milestone" defaultValue={milestone || ''}
                        className="px-4 py-2.5 bg-gray-800/60 backdrop-blur border border-gray-700/40 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40">
                        <option value="">Accessible Until...</option>
                        {milestones.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                    <button type="submit" className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-amber-600/20">Search</button>
                    {hasFilters && <Link href="/items" className="px-5 py-2.5 bg-gray-700/60 hover:bg-gray-600 text-gray-300 text-sm font-medium rounded-xl transition-colors">Clear</Link>}
                </form>

                {/* Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <Link
                            key={item.id}
                            href={`/items/${item.id.toLowerCase()}`}
                            className="group relative overflow-hidden p-4 bg-gray-800/40 backdrop-blur border border-gray-700/30 rounded-xl hover:bg-gray-700/50 hover:border-amber-500/40 transition-all duration-200"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-full blur-2xl group-hover:opacity-100 opacity-0 transition-opacity" />
                            <div className="relative">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                                        {item.name}
                                    </h3>
                                    <span className="text-[10px] px-2 py-0.5 bg-amber-900/40 text-amber-400 rounded-md font-semibold border border-amber-700/20">
                                        {POCKET_NAMES[item.pocket] || 'Unknown'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                    {item.price > 0 && (
                                        <span className="tabular-nums">₽{item.price.toLocaleString()}</span>
                                    )}
                                    {item.move && (
                                        <span className="text-purple-400">Teaches: {item.move}</span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {items.length === 0 && (
                    <div className="text-center py-12 bg-gray-800/30 rounded-xl border border-gray-700/50">
                        <p className="text-gray-400 text-lg mb-2">No items found matching your search</p>
                        <Link href="/items" className="text-amber-400 hover:text-amber-300">
                            Clear filters and show all items
                        </Link>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {page > 1 && (
                            <Link
                                href={buildUrl(page - 1)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                ← Previous
                            </Link>
                        )}

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Show pages around current page
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (page <= 3) {
                                    pageNum = i + 1;
                                } else if (page >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = page - 2 + i;
                                }
                                return (
                                    <Link
                                        key={pageNum}
                                        href={buildUrl(pageNum)}
                                        className={`px-3 py-2 rounded-lg transition-colors ${pageNum === page
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        {pageNum}
                                    </Link>
                                );
                            })}
                        </div>

                        {page < totalPages && (
                            <Link
                                href={buildUrl(page + 1)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                            >
                                Next →
                            </Link>
                        )}

                        <span className="flex items-center text-gray-500 ml-4">
                            Page {page} of {totalPages}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
