import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json({
        version: '851f6068-milestone-filter-v2',
        timestamp: new Date().toISOString(),
        sortFix: 'id-uses-pokedex-number',
        commit: '851f6068 / b8eb1bf3'
    });
}
