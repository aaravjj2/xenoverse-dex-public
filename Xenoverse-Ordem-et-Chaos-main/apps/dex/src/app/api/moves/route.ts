import { NextRequest, NextResponse } from 'next/server';
import { getMovesList } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const search = searchParams.get('search') || undefined;
  const type = searchParams.get('type') || undefined;
  const category = searchParams.get('category') || undefined;
  const powerMin = searchParams.get('powerMin') ? parseInt(searchParams.get('powerMin')!) : undefined;
  const powerMax = searchParams.get('powerMax') ? parseInt(searchParams.get('powerMax')!) : undefined;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
  const flag = searchParams.get('flag') || undefined;

  try {
    const moves = getMovesList({
      search,
      type,
      category,
      powerMin,
      powerMax,
      limit,
      offset,
      flag,
    });

    return NextResponse.json({ moves, count: moves.length });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
