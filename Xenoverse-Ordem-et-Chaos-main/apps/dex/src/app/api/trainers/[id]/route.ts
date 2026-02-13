import { NextRequest, NextResponse } from 'next/server';
import { getTrainer, getTrainerLocations } from '@/lib/db/trainers';

export const dynamic = 'force-static';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const trainer = getTrainer(id);

    if (!trainer) {
        return NextResponse.json(
            { error: 'Trainer not found' },
            { status: 404 }
        );
    }

    // Get locations from world facts
    const locations = getTrainerLocations(id);

    return NextResponse.json({
        trainer,
        locations
    });
}
