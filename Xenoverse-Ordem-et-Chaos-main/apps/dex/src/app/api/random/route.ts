import { NextResponse } from 'next/server';
import { getRandomSpecies } from '@/lib/db';

export async function GET() {
  try {
    const species = getRandomSpecies();
    
    if (!species) {
      return NextResponse.json({ error: 'No species found' }, { status: 404 });
    }
    
    return NextResponse.json({ species });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
