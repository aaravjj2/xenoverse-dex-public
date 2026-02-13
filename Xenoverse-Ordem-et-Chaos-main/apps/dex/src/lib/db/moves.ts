
import { getDb } from './connection';
import { SpeciesWithAssets } from './species';

export interface Move {
    id: string;
    name: string;
    type: string | null;
    category: string | null;
    power: number | null;
    accuracy: number | null;
    pp: number | null;
    priority: number;
    description: string | null;
    flags: string[];
}

export interface LearnsetEntry {
    move_id: string;
    move_name: string | null;
    move_type: string | null;
    move_category: string | null;
    move_power: number | null;
    power_display: string;
    is_variable_power: number;
    learn_method: string;
    level: number | null;
    learnset_source: 'form' | 'base' | 'none';
}

export function getMovesList(options: {
    search?: string;
    type?: string;
    category?: string;
    powerMin?: number;
    powerMax?: number;
    limit?: number;
    offset?: number;
    flag?: string;
}): Move[] {
    const db = getDb();
    if (!db) return [];

    let sql = `SELECT * FROM moves WHERE 1=1`;
    const params: any[] = [];

    if (options.search) {
        sql += ` AND (name LIKE ? OR id LIKE ?)`;
        params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.type) {
        sql += ` AND type = ?`;
        params.push(options.type);
    }

    if (options.category) {
        sql += ` AND category = ?`;
        params.push(options.category);
    }

    if (options.powerMin !== undefined) {
        sql += ` AND power >= ?`;
        params.push(options.powerMin);
    }

    if (options.powerMax !== undefined) {
        sql += ` AND power <= ?`;
        params.push(options.powerMax);
    }

    // Filter by flag (checking if the JSON array string contains the flag)
    if (options.flag) {
        sql += ` AND flags LIKE ?`;
        params.push(`%"${options.flag}"%`);
    }

    sql += ` ORDER BY name ASC`;

    if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
    }

    if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
    }

    try {
        const moves = db.prepare(sql).all(...params) as any[];
        return moves.map(move => ({
            ...move,
            flags: move.flags ? JSON.parse(move.flags) : []
        }));
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getMoveById(id: string): Move | null {
    const db = getDb();
    if (!db) return null;

    try {
        const move = db.prepare('SELECT * FROM moves WHERE id = ?').get(id) as any;
        if (!move) return null;

        return {
            ...move,
            flags: move.flags ? JSON.parse(move.flags) : []
        };
    } catch (error) {
        console.error('Query error:', error);
        return null;
    }
}

export function getSpeciesWithMove(moveId: string): { species: SpeciesWithAssets; learn_method: string; level: number | null }[] {
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
        a.cry_path,
        l.learn_method,
        l.level
      FROM learnsets l
      JOIN species s ON l.species_id = s.id AND l.form_id = s.form_id
      LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
      WHERE l.move_id = ?
      ORDER BY s.name, s.form_id
    `).all(moveId) as any[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getLearnset(speciesId: string, formId: number = 0): { entries: LearnsetEntry[], source: 'form' | 'base' | 'none' } {
    const db = getDb();
    if (!db) return { entries: [], source: 'none' };

    const sql = `
    SELECT 
      l.species_id,
      l.form_id,
      l.move_id, 
      l.learn_method, 
      l.level,
      m.name as move_name, 
      m.type as move_type, 
      m.category as move_category, 
      m.power as move_power,
      m.is_variable_power
    FROM learnsets l
    LEFT JOIN moves m ON l.move_id = m.id
    WHERE l.species_id = ? AND l.form_id = ?
    ORDER BY l.learn_method, l.level, m.name
  `;

    try {
        let results = db.prepare(sql).all(speciesId, formId) as any[];
        let source: 'form' | 'base' | 'none' = results.length > 0 ? 'form' : 'none';

        if (results.length === 0 && formId > 0) {
            const baseId = speciesId.replace(/_\d+$/, '');
            results = db.prepare(sql).all(baseId, 0) as any[];
            if (results.length > 0) {
                source = 'base';
            }
        }

        const entries: LearnsetEntry[] = results.map(row => ({
            move_id: row.move_id,
            move_name: row.move_name,
            move_type: row.move_type,
            move_category: row.move_category,
            move_power: row.move_power,
            power_display: row.is_variable_power ? 'Varies' : (row.move_power != null ? String(row.move_power) : '—'),
            is_variable_power: row.is_variable_power || 0,
            learn_method: row.learn_method,
            level: row.level,
            learnset_source: source,
        }));

        return { entries, source };
    } catch (error) {
        console.error('Query error:', error);
        return { entries: [], source: 'none' };
    }
}
