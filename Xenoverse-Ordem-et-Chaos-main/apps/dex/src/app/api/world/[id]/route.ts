import { NextRequest, NextResponse } from 'next/server';
import { getWorldFact } from '@/lib/db/world';

export const dynamic = 'force-static';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const fact = getWorldFact(parseInt(id));

    if (!fact) {
        return NextResponse.json(
            { error: 'World fact not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({ fact });
}
