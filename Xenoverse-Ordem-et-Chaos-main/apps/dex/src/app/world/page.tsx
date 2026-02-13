import { getWorldFactsList, getWorldFactTypes, getWorldFactsStats, getWorldFactsTotal } from '@/lib/db/world';
import WorldPageClient from './WorldPageClient';

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WorldPage({ searchParams }: Props) {
    const params = await searchParams;

    const type = typeof params.type === 'string' ? params.type : undefined;
    const confidence = typeof params.confidence === 'string' ? params.confidence : undefined;
    const mapId = typeof params.map_id === 'string' ? parseInt(params.map_id) : undefined;
    const search = typeof params.q === 'string' ? params.q : undefined;

    const facts = getWorldFactsList({
        type,
        confidence,
        mapId: isNaN(mapId as number) ? undefined : mapId,
        search,
        limit: 200
    });

    const total = getWorldFactsTotal({
        type,
        confidence,
        mapId: isNaN(mapId as number) ? undefined : mapId,
        search
    });

    const types = getWorldFactTypes();
    const stats = getWorldFactsStats();

    return <WorldPageClient initialFacts={facts} total={total} types={types} stats={stats} />;
}
