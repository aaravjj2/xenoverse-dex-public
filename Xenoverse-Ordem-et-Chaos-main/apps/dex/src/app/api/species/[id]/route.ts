import { NextRequest, NextResponse } from 'next/server';
import { getSpeciesById, getEvolutions, getLearnset, getAdjacentSpecies, getTypesWithEffectiveness, getSpeciesForms, getSpeciesEncounters } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const formId = parseInt(searchParams.get('form') || '0');

  try {
    const species = getSpeciesById(id, formId);

    if (!species) {
      return NextResponse.json({ error: 'Species not found' }, { status: 404 });
    }

    const evolutions = getEvolutions(id, formId);
    const learnsetResult = getLearnset(id, formId);
    const adjacent = getAdjacentSpecies(id, formId);
    const allTypes = getTypesWithEffectiveness();
    const forms = getSpeciesForms(id);
    const encounters = getSpeciesEncounters(id); // Fetch basic encounters (ignoring forms for now or assuming base species locations)

    // Calculate type effectiveness
    const typeEffectiveness = calculateTypeEffectiveness(species.type1, species.type2, allTypes);

    return NextResponse.json({
      species,
      evolutions,
      learnset: learnsetResult.entries,
      learnsetSource: learnsetResult.source,
      encounters,
      adjacent,
      typeEffectiveness,
      forms: forms.length > 1 ? forms : [],  // Only include if there are alternate forms
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateTypeEffectiveness(
  type1: string | null,
  type2: string | null,
  allTypes: { id: string; name: string; weaknesses: string | null; resistances: string | null; immunities: string | null }[]
) {
  const effectiveness: Record<string, number> = {};

  // Initialize all types with neutral effectiveness (1x)
  for (const type of allTypes) {
    effectiveness[type.id] = 1;
  }

  // Helper to parse JSON array or comma-separated string
  const parseTypeList = (str: string | null): string[] => {
    if (!str) return [];
    try {
      // Try parsing as JSON first
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      // Fall back to comma-separated
      return str.split(',').map(s => s.trim()).filter(Boolean);
    }
  };

  // Helper to apply type modifiers
  const applyTypeModifiers = (typeId: string | null) => {
    if (!typeId) return;

    const typeData = allTypes.find(t => t.id === typeId);
    if (!typeData) return;

    // Parse weaknesses - takes 2x damage
    const weaknesses = parseTypeList(typeData.weaknesses);
    for (const w of weaknesses) {
      effectiveness[w] = (effectiveness[w] || 1) * 2;
    }

    // Parse resistances - takes 0.5x damage
    const resistances = parseTypeList(typeData.resistances);
    for (const r of resistances) {
      effectiveness[r] = (effectiveness[r] || 1) * 0.5;
    }

    // Parse immunities - takes 0x damage
    const immunities = parseTypeList(typeData.immunities);
    for (const i of immunities) {
      effectiveness[i] = 0;
    }
  };

  applyTypeModifiers(type1);
  applyTypeModifiers(type2);

  // Group by effectiveness
  const weak: string[] = [];
  const resist: string[] = [];
  const immune: string[] = [];
  const normal: string[] = [];

  for (const [typeId, mult] of Object.entries(effectiveness)) {
    if (mult === 0) immune.push(typeId);
    else if (mult > 1) weak.push(`${typeId}${mult > 2 ? ' (4x)' : ''}`);
    else if (mult < 1) resist.push(`${typeId}${mult < 0.5 ? ' (0.25x)' : ''}`);
    else normal.push(typeId);
  }

  return { weak, resist, immune, normal, raw: effectiveness };
}
