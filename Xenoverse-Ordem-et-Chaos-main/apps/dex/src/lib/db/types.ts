
import { getDb } from './connection';

export interface TypeFull {
    id: string;
    name: string;
    is_pseudo_type: number;
    is_special_type: number;
    weaknesses: string | null;
    resistances: string | null;
    immunities: string | null;
    icon_position: number | null;
}

export function getTypes(): { id: string; name: string }[] {
    const db = getDb();
    if (!db) return [];

    try {
        return db.prepare('SELECT id, name FROM types ORDER BY name').all() as { id: string; name: string }[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getTypesWithEffectiveness(): TypeFull[] {
    const db = getDb();
    if (!db) return [];

    try {
        return db.prepare('SELECT * FROM types WHERE is_pseudo_type = 0 ORDER BY id').all() as TypeFull[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getTypeById(id: string): TypeFull | null {
    const db = getDb();
    if (!db) return null;

    try {
        return db.prepare('SELECT * FROM types WHERE id = ?').get(id) as TypeFull | null;
    } catch (error) {
        console.error('Query error:', error);
        return null;
    }
}
