
import { getTypesWithEffectiveness } from '@/lib/db';

export interface DefensiveEffectiveness {
    weak: string[];
    resist: string[];
    immune: string[];
    normal: string[];
}

/**
 * Calculates the defensive type effectiveness for a given dual or single type combination.
 * Returns lists of types that are Weak, Resist, Immune, or Normal against the defender.
 */
export function getDefensiveEffectiveness(type1: string | null, type2: string | null): DefensiveEffectiveness {
    const allTypes = getTypesWithEffectiveness();

    // Map<Type, Multiplier>
    const defensiveMultipliers = new Map<string, number>();

    // Initialize all types to 1.0
    allTypes.forEach(t => defensiveMultipliers.set(t.name, 1.0));

    const applyType = (typeName: string | null) => {
        if (!typeName) return;
        const typeData = allTypes.find(t => t.name.toUpperCase() === typeName.toUpperCase());
        if (!typeData) return;

        // Parse weaknesses (2x damage taken)
        if (typeData.weaknesses) {
            try {
                // The DB stores comma-separated strings "TYPE 2.0" or potentially just "TYPE" if strictly lists.
                // Based on previous code analysis, it seems to parse JSON or split.
                // However, `getTypesWithEffectiveness` in `db/types.ts` is the source of truth.
                // Let's robustly handle the string format.

                // Assuming JSON array of strings based on the previous page.tsx code:
                // const weaks = JSON.parse(typeData.weaknesses) as string[];

                let weaks: string[] = [];
                if (typeData.weaknesses.startsWith('[')) {
                    weaks = JSON.parse(typeData.weaknesses);
                } else {
                    weaks = typeData.weaknesses.split(',').map(s => s.trim()).filter(Boolean);
                }

                weaks.forEach(t => {
                    // t might be "WATER" or "WATER 2.0" (if data is messy).
                    // Assuming clean type names based on typical pokedex dbs.
                    const typeName = t.split(' ')[0];
                    defensiveMultipliers.set(typeName, (defensiveMultipliers.get(typeName) || 1.0) * 2.0);
                });
            } catch (e) {
                console.error(`Error parsing weaknesses for ${typeName}`, e);
            }
        }

        // Parse resistances (0.5x damage taken)
        if (typeData.resistances) {
            try {
                let res: string[] = [];
                if (typeData.resistances.startsWith('[')) {
                    res = JSON.parse(typeData.resistances);
                } else {
                    res = typeData.resistances.split(',').map(s => s.trim()).filter(Boolean);
                }

                res.forEach(t => {
                    const typeName = t.split(' ')[0];
                    defensiveMultipliers.set(typeName, (defensiveMultipliers.get(typeName) || 1.0) * 0.5);
                });
            } catch (e) {
                console.error(`Error parsing resistances for ${typeName}`, e);
            }
        }

        // Parse immunities (0x damage taken)
        if (typeData.immunities) {
            try {
                let imm: string[] = [];
                if (typeData.immunities.startsWith('[')) {
                    imm = JSON.parse(typeData.immunities);
                } else {
                    imm = typeData.immunities.split(',').map(s => s.trim()).filter(Boolean);
                }

                imm.forEach(t => {
                    const typeName = t.split(' ')[0];
                    defensiveMultipliers.set(typeName, 0);
                });
            } catch (e) {
                console.error(`Error parsing immunities for ${typeName}`, e);
            }
        }
    };

    applyType(type1);
    applyType(type2);

    const result: DefensiveEffectiveness = {
        weak: [],
        resist: [],
        immune: [],
        normal: []
    };

    defensiveMultipliers.forEach((mult, type) => {
        if (mult > 1) result.weak.push(`${type} ${mult}x`);
        else if (mult === 0) result.immune.push(type);
        else if (mult < 1) result.resist.push(`${type} ${mult}x`);
        else result.normal.push(type);
    });

    return result;
}
