import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    
    // Get a random base form species
    const species = db.prepare(`
      SELECT ps.id, ps.name, ps.type1, ps.type2
      FROM pokemon_species ps
      WHERE ps.form_id = 0
      ORDER BY RANDOM()
      LIMIT 1
    `).get() as { id: string; name: string; type1: string | null; type2: string | null } | undefined;

    if (!species) {
      return NextResponse.json({ error: 'No species found' }, { status: 404 });
    }

    return NextResponse.json({
      id: species.id,
      name: species.name,
      type1: species.type1,
      type2: species.type2,
    });
  } catch (error) {
    console.error('Random species error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
