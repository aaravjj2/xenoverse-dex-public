
import { getDb } from './connection';

export interface EncounterEntry {
    map_name: string;
    version: number;
    type: string;
    min_level: number;
    max_level: number;
    chance: number;
}

export function getSpeciesEncounters(speciesId: string): EncounterEntry[] {
    const db = getDb();
    if (!db) return [];

    const sql = `
    SELECT 
      e.map_name,
      e.version,
      es.type,
      es.min_level,
      es.max_level,
      es.chance
    FROM encounter_slots es
    JOIN encounters e ON es.encounter_id = e.id
    WHERE es.species_id = ?
    ORDER BY e.map_name, es.type, es.min_level
  `;

    try {
        return db.prepare(sql).all(speciesId) as EncounterEntry[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}
