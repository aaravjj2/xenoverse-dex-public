import { NextRequest, NextResponse } from 'next/server';
import { getSpeciesList } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const parseNumber = (value: string | null): number | undefined => {
    if (value == null || value.trim() === '') return undefined;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parseBoolean = (value: string | null): boolean | undefined => {
    if (value == null) return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  };

  const search = searchParams.get('search') || undefined;
  const types = searchParams.get('types')
    ? searchParams
      .get('types')!
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean)
    : undefined;
  const typeMatchParam = searchParams.get('typeMatch');
  const typeMatch = typeMatchParam === 'all' || typeMatchParam === 'any' ? typeMatchParam : undefined;

  const bstMin = parseNumber(searchParams.get('bstMin'));
  const bstMax = parseNumber(searchParams.get('bstMax'));
  const hasEvolutions = parseBoolean(searchParams.get('hasEvolutions'));
  const hasForms = parseBoolean(searchParams.get('hasForms'));
  const hasLearnset = parseBoolean(searchParams.get('hasLearnset'));
  const missingAssets = parseBoolean(searchParams.get('missingAssets'));
  const baseOnlyParam = parseBoolean(searchParams.get('baseOnly'));
  const baseOnly = baseOnlyParam ?? true;
  const showDev = parseBoolean(searchParams.get('showDev'));
  const sortBy = searchParams.get('sortBy') || undefined;
  const sortOrderParam = searchParams.get('sortOrder');
  const sortOrder = sortOrderParam === 'desc' ? 'desc' : sortOrderParam === 'asc' ? 'asc' : undefined;
  const limit = parseNumber(searchParams.get('limit'));
  const offset = parseNumber(searchParams.get('offset'));
  const ability = searchParams.get('ability') || undefined;
  const eggGroup = searchParams.get('eggGroup') || undefined;
  const move = searchParams.get('move') || undefined;

  const results = getSpeciesList({
    search,
    types,
    typeMatch,
    bstMin,
    bstMax,
    hasEvolutions,
    hasForms,
    hasLearnset,
    missingAssets,
    baseOnly,
    showDev,
    sortBy,
    sortOrder,
    limit,
    offset,
    ability,
    eggGroup,
    move,
  });

  return NextResponse.json({ species: results, count: results.length });
}
