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

    const filterOptions = { search: search || undefined, pocket, milestone };
    const total = getItemsCount(filterOptions);
    const items = getItemsList({
        ...filterOptions,
        limit: pageSize,
        offset
    });

    const totalPages = Math.ceil(total / pageSize);
    const hasFilters = search || pocket !== undefined || milestone !== undefined;
    
    const milestones = [
        { value: 'westar-gym', label: 'Westar Gym' },
        { value: 'ishtar-gym', label: 'Ishtar Gym' },
        { value: 'hadwarf-gym', label: 'Hadwarf Gym' },
        { value: 'newtron-gym', label: 'Newtron Gym' },
        { value: 'hypelion-gym', label: 'Hypelion Gym' },
        { value: 'vermillion-gym', label: 'Vermillion Gym' },
        { value: 'milkyway-gym', label: 'Milkyway Gym' },
    ];

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
        <div className="animate-fade-in">
            {/* Header */}
            <div className="glass-card !rounded-2xl p-6 mb-6 bg-gradient-to-r from-amber-600/10 via-yellow-500/5 to-amber-600/10 border-amber-500/20">
                <h1 className="text-3xl font-bold text-gradient-amber mb-2">Items</h1>
                <p className="text-amber-200/60 text-sm">
                    {hasFilters ? (
                        total > 0 ? (
                            <>Showing {items.length} of {total.toLocaleString()} results</>
                        ) : (
                            <>No results found</>
                        )
                    ) : (
                        <>All {total.toLocaleString()} items in the Xenoverse database</>
                    )}
                </p>
            </div>

            {/* Filters */}
            <form className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-64">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" name="search" placeholder="Search items by name..." defaultValue={search}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm placeholder-slate-500" />
                </div>
                <select name="pocket" defaultValue={pocket?.toString() || ''}
                    className="px-4 py-2.5 rounded-xl text-sm">
                    <option value="">All Pockets</option>
                    {Object.entries(POCKET_NAMES).map(([value, name]) => (
                        <option key={value} value={value}>{name}</option>
                    ))}
                </select>
                <select name="milestone" defaultValue={milestone || ''}
                    className="px-4 py-2.5 rounded-xl text-sm">
                    <option value="">Accessible Until...</option>
                    {milestones.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30">
                    Search
                </button>
                {hasFilters && <Link href="/items" className="px-5 py-2.5 btn-secondary text-sm">Clear</Link>}
            </form>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                    <Link
                        key={item.id}
                        href={`/items/${item.id.toLowerCase()}`}
                        className="glass-card p-4 group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                                {item.name}
                            </h3>
                            <span className="text-[10px] px-2 py-0.5 bg-amber-900/30 text-amber-400 rounded-lg font-semibold border border-amber-500/20">
                                {POCKET_NAMES[item.pocket] || 'Unknown'}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 mb-3 leading-relaxed">{item.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            {item.price > 0 && (
                                <span className="tabular-nums text-amber-400/80">₽{item.price.toLocaleString()}</span>
                            )}
                            {item.move && (
                                <span className="text-purple-400">Teaches: {item.move}</span>
                            )}
                        </div>
                    </Link>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center py-16 glass-card !rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <p className="text-slate-400 text-lg mb-2">No items found</p>
                    <Link href="/items" className="text-amber-400 hover:text-amber-300 text-sm">
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
                            className="px-4 py-2 btn-secondary text-sm"
                        >
                            ← Previous
                        </Link>
                    )}

                    <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                                    className={`px-3 py-2 rounded-xl text-sm transition-all ${pageNum === page
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-600/20'
                                        : 'btn-secondary'
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
                            className="px-4 py-2 btn-secondary text-sm"
                        >
                            Next →
                        </Link>
                    )}

                    <span className="flex items-center text-slate-500 ml-4 text-sm">
                        Page {page} of {totalPages}
                    </span>
                </div>
            )}
        </div>
    );
}
