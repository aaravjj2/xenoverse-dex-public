import { NextRequest, NextResponse } from 'next/server';
import { getItemsList, getItemsCount, POCKET_NAMES } from '@/lib/db/items';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search') || undefined;
    const pocket = searchParams.get('pocket') ? parseInt(searchParams.get('pocket')!) : undefined;
    const progress = searchParams.get('progress') === 'all' ? 'all' : 'ishtar';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const options = {
        search,
        pocket,
        accessibleUntil: progress === 'all' ? undefined : 'Ishtar Gym'
    };

    const items = getItemsList({
        ...options,
        limit,
        offset
    });

    const total = getItemsCount(options);

    return NextResponse.json({
        total,
        results: items,
        limit,
        offset,
        q: search || '',
        filters: { search, pocket, progress },
        pocketNames: POCKET_NAMES
    });
}
