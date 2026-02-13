import { getTrainersGroupedByRoute, getTrainerTypes, getBossCategory, BOSS_TRAINER_TYPES } from '@/lib/db/trainers';
import { TrainerSprite } from '@/components/TrainerSprite';
import Link from 'next/link';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function TrainersPage({ searchParams }: Props) {
    const params = await searchParams;
    const search = typeof params.search === 'string' ? params.search : '';
    const trainerType = typeof params.type === 'string' ? params.type : undefined;
    // Default to showing boss fights only unless explicitly set to 'all'
    const showAll = params.view === 'all';
    const bossOnly = !showAll;

    const routeGroups = getTrainersGroupedByRoute({
        search: search || undefined,
        trainerType,
        bossOnly,
    });

    const trainerTypes = bossOnly ? [...BOSS_TRAINER_TYPES] : getTrainerTypes();
    const totalTrainers = routeGroups.reduce((sum, g) => sum + g.trainers.length, 0);


    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-950/10 to-gray-900">
            {/* Header with premium gradient */}
            <div className="relative overflow-hidden bg-gradient-to-r from-red-600/20 via-orange-500/15 to-red-600/20 border-b border-red-500/30">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent"></div>
                <div className="relative max-w-7xl mx-auto px-4 py-10">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-red-200 via-orange-200 to-red-200 bg-clip-text text-transparent mb-3">
                        {bossOnly ? 'Boss Fights' : 'All Trainers'}
                    </h1>
                    <p className="text-red-200/60 text-lg">
                        {bossOnly
                            ? `${totalTrainers} gym leaders, rivals & story battles`
                            : `${totalTrainers} trainers across ${routeGroups.length} locations`}
                    </p>
                </div>
            </div>

            {/* Filters with glass effect */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* View Toggle */}
                <div className="flex gap-2 mb-6">
                    <Link
                        href="/trainers"
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${bossOnly
                            ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        ⚔️ Boss Fights
                    </Link>
                    <Link
                        href="/trainers?view=all"
                        className={`px-5 py-2.5 rounded-xl font-medium transition-all ${!bossOnly
                            ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                            }`}
                    >
                        👥 All Trainers
                    </Link>
                </div>

                <form className="flex flex-wrap gap-4 mb-10 p-4 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                    <input
                        type="text"
                        name="search"
                        placeholder="Search trainers or locations..."
                        defaultValue={search}
                        className="flex-1 min-w-64 px-5 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                    />
                    {/* Preserve view param in form */}
                    {!bossOnly && <input type="hidden" name="view" value="all" />}
                    <select
                        name="type"
                        defaultValue={trainerType || ''}
                        className="px-5 py-3 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all cursor-pointer"
                    >
                        <option value="">All Types</option>
                        {trainerTypes.map((type) => (
                            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        Search
                    </button>
                </form>


                {/* Route-Grouped Trainers */}
                <div className="space-y-8">
                    {routeGroups.map((group, idx) => (
                        <details
                            key={group.mapId ?? 'unknown'}
                            className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl"
                            open={idx < 3}
                        >
                            {/* Route Header */}
                            <summary className="flex items-center justify-between px-6 py-5 cursor-pointer bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-emerald-900/40 hover:from-emerald-800/50 hover:via-teal-800/40 hover:to-emerald-800/50 transition-all duration-300 border-b border-emerald-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-emerald-500/30 to-teal-600/30 rounded-xl border border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                                        <span className="text-2xl">📍</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-emerald-100 group-open:text-emerald-200 transition-colors">
                                            {group.mapName || 'Unknown Location'}
                                        </h2>
                                        <p className="text-sm text-emerald-300/50 mt-0.5">
                                            {group.mapId ? `Map #${group.mapId}` : 'Location data pending'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-emerald-300/80 bg-emerald-900/50 px-4 py-1.5 rounded-full border border-emerald-500/20">
                                        {group.trainers.length} trainer{group.trainers.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="text-emerald-300/60 group-open:rotate-180 transition-transform duration-300">▼</span>
                                </div>
                            </summary>

                            {/* Trainer Cards Grid */}
                            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {group.trainers.map((trainer, idx) => (
                                    <Link
                                        key={`${trainer.id}-${group.mapId ?? 'unknown'}-${idx}`}
                                        href={`/trainers/${encodeURIComponent(trainer.id)}`}
                                        className="group/card relative flex items-center gap-4 p-4 bg-gradient-to-br from-gray-800/70 to-gray-900/70 border border-gray-600/30 rounded-xl hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/5 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5"
                                    >
                                        {/* Hover glow effect */}
                                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/0 via-red-500/0 to-orange-500/0 group-hover/card:from-red-500/5 group-hover/card:via-red-500/10 group-hover/card:to-orange-500/5 transition-all duration-300"></div>

                                        {/* Trainer Sprite */}
                                        <TrainerSprite trainerType={trainer.trainerType} />

                                        {/* Trainer Info */}
                                        <div className="relative flex-1 min-w-0">
                                            <h3 className="font-bold text-white group-hover/card:text-red-200 transition-colors truncate text-lg">
                                                {trainer.name}
                                            </h3>
                                            <span className="inline-block text-xs font-medium px-2.5 py-1 bg-gradient-to-r from-red-900/60 to-orange-900/40 text-red-300 rounded-lg mt-1.5 border border-red-500/20">
                                                {trainer.trainerType.replace('LEADER_', 'Gym Leader ').replace(/_/g, ' ')}
                                            </span>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                                                <span className="flex items-center gap-1 bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700/50">
                                                    <span className="text-red-400">⚔️</span>
                                                    {trainer.partyCount}
                                                </span>
                                                <span className="text-gray-500 font-mono text-[10px] uppercase tracking-wider border border-gray-700 px-1.5 py-0.5 rounded bg-gray-800/30">
                                                    {trainer.version === 0 ? 'Standard' : `Var ${trainer.version}`}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </details>
                    ))}
                </div>

                {routeGroups.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-400 text-lg">No trainers found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
