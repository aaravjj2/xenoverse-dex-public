import { NextRequest, NextResponse } from 'next/server';
import { getTypeById, getSpeciesList } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const type = getTypeById(id);
    
    if (!type) {
      return NextResponse.json({ error: 'Type not found' }, { status: 404 });
    }
    
    // Get all species of this type
    const species = getSpeciesList({ types: [id], typeMatch: 'any' });
    
    return NextResponse.json({ type, species });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
