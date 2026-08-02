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
        <div className="animate-fade-in">
            {/* Header */}
            <div className="glass-card !rounded-2xl p-6 mb-6 bg-gradient-to-r from-red-600/10 via-orange-500/5 to-red-600/10 border-red-500/20">
                <h1 className="text-3xl font-bold text-gradient-amber mb-2">
                    {bossOnly ? 'Boss Fights' : 'All Trainers'}
                </h1>
                <p className="text-red-200/50 text-sm">
                    {bossOnly
                        ? `${totalTrainers} gym leaders, rivals & story battles`
                        : `${totalTrainers} trainers across ${routeGroups.length} locations`}
                </p>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 mb-5">
                <Link
                    href="/trainers"
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${bossOnly
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/20'
                        : 'btn-secondary'
                        }`}
                >
                    ⚔️ Boss Fights
                </Link>
                <Link
                    href="/trainers?view=all"
                    className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${!bossOnly
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/20'
                        : 'btn-secondary'
                        }`}
                >
                    👥 All Trainers
                </Link>
            </div>

            {/* Filters */}
            <form className="flex flex-wrap gap-3 mb-8 p-4 glass-card !rounded-2xl">
                <input
                    type="text"
                    name="search"
                    placeholder="Search trainers or locations..."
                    defaultValue={search}
                    className="flex-1 min-w-64 px-4 py-2.5 rounded-xl text-sm placeholder-slate-500"
                />
                {!bossOnly && <input type="hidden" name="view" value="all" />}
                <select
                    name="type"
                    defaultValue={trainerType || ''}
                    className="px-4 py-2.5 rounded-xl text-sm cursor-pointer"
                >
                    <option value="">All Types</option>
                    {trainerTypes.map((type) => (
                        <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                    ))}
                </select>
                <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                >
                    Search
                </button>
            </form>


            {/* Route-Grouped Trainers */}
            <div className="space-y-6">
                {routeGroups.map((group, idx) => (
                    <details
                        key={group.mapId ?? 'unknown'}
                        className="group glass-card !rounded-2xl overflow-hidden"
                        open={idx < 3}
                    >
                        {/* Route Header */}
                        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer bg-gradient-to-r from-emerald-900/20 via-teal-900/10 to-emerald-900/20 hover:from-emerald-800/30 hover:via-teal-800/20 hover:to-emerald-800/30 transition-all border-b border-emerald-500/10 rounded-t-2xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-xl border border-emerald-400/20">
                                    <span className="text-xl">📍</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-emerald-100 group-open:text-emerald-200 transition-colors">
                                        {group.mapName || 'Unknown Location'}
                                    </h2>
                                    <p className="text-xs text-emerald-300/40 mt-0.5">
                                        {group.mapId ? `Map #${group.mapId}` : 'Location data pending'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-emerald-300/70 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/20">
                                    {group.trainers.length} trainer{group.trainers.length !== 1 ? 's' : ''}
                                </span>
                                <span className="text-emerald-300/50 group-open:rotate-180 transition-transform duration-300">▼</span>
                            </div>
                        </summary>

                        {/* Trainer Cards Grid */}
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {group.trainers.map((trainer, idx) => (
                                <Link
                                    key={`${trainer.id}-${group.mapId ?? 'unknown'}-${idx}`}
                                    href={`/trainers/${encodeURIComponent(trainer.id)}`}
                                    className="glass-card p-4 group/card flex items-center gap-4"
                                >
                                    {/* Trainer Sprite */}
                                    <TrainerSprite trainerType={trainer.trainerType} />

                                    {/* Trainer Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white group-hover/card:text-red-200 transition-colors truncate">
                                            {trainer.name}
                                        </h3>
                                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 bg-gradient-to-r from-red-900/40 to-orange-900/30 text-red-300 rounded-lg mt-1 border border-red-500/20">
                                            {trainer.trainerType.replace('LEADER_', 'Gym Leader ').replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1.5">
                                            <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                                                <span className="text-red-400">⚔️</span>
                                                {trainer.partyCount}
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
                <div className="text-center py-16 glass-card !rounded-2xl">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <p className="text-slate-400 text-lg">No trainers found</p>
                </div>
            )}
        </div>
    );
}
