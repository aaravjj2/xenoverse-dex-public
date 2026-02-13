import { NextResponse } from 'next/server';
import { getAbilities } from '@/lib/db';

export async function GET() {
  try {
    const abilities = getAbilities();
    return NextResponse.json({ abilities });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
