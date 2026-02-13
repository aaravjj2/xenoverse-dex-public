import { NextResponse } from 'next/server';
import { getTypesWithEffectiveness } from '@/lib/db';

export async function GET() {
  try {
    const types = getTypesWithEffectiveness();
    return NextResponse.json({ types });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
