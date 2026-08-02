import { NextRequest, NextResponse } from 'next/server';
import { getMoveById, getSpeciesWithMove } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const move = getMoveById(id);
    
    if (!move) {
      return NextResponse.json({ error: 'Move not found' }, { status: 404 });
    }
    
    const learnedBy = getSpeciesWithMove(id);
    
    return NextResponse.json({ move, learnedBy });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
