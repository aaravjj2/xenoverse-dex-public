import { NextRequest, NextResponse } from 'next/server';
import { getWorldFactsList, getWorldFactTypes, getWorldFactsStats, getWorldFactsTotal, getWorldFactsBreakdowns } from '@/lib/db/world';



export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const type = searchParams.get('type') || undefined;
    const confidence = searchParams.get('confidence') || undefined;
    const mapId = searchParams.get('map_id') ? parseInt(searchParams.get('map_id')!) : undefined;
    const search = searchParams.get('q') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const facts = getWorldFactsList({
        type,
        confidence,
        mapId,
        search,
        limit,
        offset
    });

    const total = getWorldFactsTotal({
        type,
        confidence,
        mapId,
        search
    });

    const types = getWorldFactTypes();
    // const stats = getWorldFactsStats(); // Deprecated in favor of detailed breakdowns
    const { byType, byConfidence } = getWorldFactsBreakdowns();

    return NextResponse.json({
        facts,
        total,
        limit,
        offset,
        types,
        stats: Object.entries(byType).map(([type, count]) => ({ type, count })), // Backwards compat for now if needed
        breakdown_by_type: byType,
        breakdown_by_confidence: byConfidence
    });
}
