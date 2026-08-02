import { NextRequest, NextResponse } from 'next/server';
import { getAbilityById, getSpeciesWithAbility } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const ability = getAbilityById(id);
    
    if (!ability) {
      return NextResponse.json({ error: 'Ability not found' }, { status: 404 });
    }
    
    const species = getSpeciesWithAbility(id);
    
    return NextResponse.json({ ability, species });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
