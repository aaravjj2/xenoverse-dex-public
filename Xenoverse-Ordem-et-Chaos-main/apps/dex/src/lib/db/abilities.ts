
import { getDb } from './connection';
import { SpeciesWithAssets } from './species';

export interface Ability {
    id: string;
    name: string;
    description: string | null;
    flags: string | null;
}

export function getAbilities(): Ability[] {
    const db = getDb();
    if (!db) return [];

    try {
        return db.prepare('SELECT * FROM abilities ORDER BY name').all() as Ability[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getAbilityById(id: string): Ability | null {
    const db = getDb();
    if (!db) return null;

    try {
        return db.prepare('SELECT * FROM abilities WHERE id = ?').get(id) as Ability | null;
    } catch (error) {
        console.error('Query error:', error);
        return null;
    }
}

export function getSpeciesWithAbility(abilityId: string): SpeciesWithAssets[] {
    const db = getDb();
    if (!db) return [];

    try {
        return db.prepare(`
      SELECT 
        s.*,
        a.icon_path,
        a.front_path,
        a.front_shiny_path,
        a.back_path,
        a.cry_path
      FROM species s
      LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
      WHERE s.ability1 = ? OR s.ability2 = ? OR s.hidden_ability = ?
      ORDER BY s.id, s.form_id
    `).all(abilityId, abilityId, abilityId) as SpeciesWithAssets[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}
