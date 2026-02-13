import { NextRequest, NextResponse } from 'next/server';
import { getTrainersList, getTrainerTypes } from '@/lib/db/trainers';

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get('search') || undefined;
    const trainerType = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const trainers = getTrainersList({
        search,
        trainerType,
        limit,
        offset
    });

    const trainerTypes = getTrainerTypes();

    return NextResponse.json({
        trainers,
        trainerTypes
    });
}
