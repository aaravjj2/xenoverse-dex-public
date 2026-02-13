import { NextRequest, NextResponse } from 'next/server';
import { getItem, getItemLocations } from '@/lib/db/items';

export const dynamic = 'force-static';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const item = getItem(id.toUpperCase());

    if (!item) {
        return NextResponse.json(
            { error: 'Item not found' },
            { status: 404 }
        );
    }

    // Get locations from world facts
    const locations = getItemLocations(id.toUpperCase());

    return NextResponse.json({
        item,
        locations
    });
}
