import { getDb } from './connection';

/**
 * World facts query options
 */
export interface GetWorldFactsOptions {
    type?: string;
    confidence?: string;
    mapId?: number;
    search?: string;
    limit?: number;
    offset?: number;
}

export interface WorldFact {
    id: number;
    type: string;
    mapId: number;
    mapName: string | null;
    eventId: number | null;
    pageIndex: number | null;
    commandIndex: number | null;
    payload: Record<string, any>;
    confidence: string;
    reason: string | null;
    rawSnippet: string | null;
    conditions: Record<string, any> | null;
}

/**
 * Get world facts list with filtering
 */
export function getWorldFactsList(options: GetWorldFactsOptions = {}): WorldFact[] {
    const db = getDb();
    const { type, confidence, mapId, search, limit = 100, offset = 0 } = options;

    let sql = `
    SELECT id, type, map_id, map_name, event_id, page_index, command_index,
           payload, confidence, reason, raw_snippet, conditions
    FROM world_facts
    WHERE 1=1
  `;

    const params: (string | number)[] = [];

    if (type) {
        sql += ` AND type = ?`;
        params.push(type);
    }

    if (confidence) {
        sql += ` AND confidence = ?`;
        params.push(confidence);
    }

    if (mapId !== undefined) {
        sql += ` AND map_id = ?`;
        params.push(mapId);
    }

    if (search) {
        sql += ` AND (raw_snippet LIKE ? OR map_name LIKE ? OR payload LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    sql += ` ORDER BY map_id, type, id LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    if (rows.length > 0) {
        console.error('DEBUG_ERROR: First row from DB:', rows[0]);
        console.error('DEBUG_ERROR: Mapped pageIndex:', rows[0].page_index);
    }

    return rows.map(row => ({
        id: row.id,
        type: row.type,
        mapId: row.map_id,
        mapName: row.map_name,
        eventId: row.event_id,
        pageIndex: row.page_index,
        commandIndex: row.command_index,
        payload: JSON.parse(row.payload),
        confidence: row.confidence,
        reason: row.reason,
        rawSnippet: row.raw_snippet,
        conditions: row.conditions ? JSON.parse(row.conditions) : null
    }));
}

/**
 * Get a single world fact by ID
 */
export function getWorldFact(id: number): WorldFact | null {
    const db = getDb();

    const row = db.prepare(`
    SELECT id, type, map_id, map_name, event_id, page_index, command_index,
           payload, confidence, reason, raw_snippet, conditions
    FROM world_facts
    WHERE id = ?
  `).get(id) as any;

    if (!row) return null;

    return {
        id: row.id,
        type: row.type,
        mapId: row.map_id,
        mapName: row.map_name,
        eventId: row.event_id,
        pageIndex: row.page_index,
        commandIndex: row.command_index,
        payload: JSON.parse(row.payload || '{}'),
        confidence: row.confidence,
        reason: row.reason,
        rawSnippet: row.raw_snippet,
        conditions: row.conditions ? JSON.parse(row.conditions) : null
    };
}

/**
 * Get unique fact types for filtering
 */
export function getWorldFactTypes(): string[] {
    const db = getDb();

    const rows = db.prepare(`
    SELECT DISTINCT type FROM world_facts ORDER BY type
  `).all() as any[];

    return rows.map(r => r.type);
}

/**
 * Get unique maps for filtering
 */
export function getWorldFactMaps(): { mapId: number; mapName: string }[] {
    const db = getDb();

    const rows = db.prepare(`
    SELECT DISTINCT map_id, map_name FROM world_facts 
    WHERE map_name IS NOT NULL
    ORDER BY map_id
  `).all() as any[];

    return rows.map(r => ({ mapId: r.map_id, mapName: r.map_name }));
}

/**
 * Get world facts statistics
 */
/**
 * Get world facts statistics
 */
export function getWorldFactsStats(): { type: string; count: number }[] {
    const db = getDb();

    const rows = db.prepare(`
    SELECT type, COUNT(*) as count FROM world_facts GROUP BY type ORDER BY count DESC
  `).all() as any[];

    return rows.map(r => ({ type: r.type, count: r.count }));
}

/**
 * Get total count of world facts matching filters
 */
export function getWorldFactsTotal(options: GetWorldFactsOptions = {}): number {
    const db = getDb();
    const { type, confidence, mapId, search } = options;

    let sql = `SELECT COUNT(*) as count FROM world_facts WHERE 1=1`;
    const params: (string | number)[] = [];

    if (type) {
        sql += ` AND type = ?`;
        params.push(type);
    }

    if (confidence) {
        sql += ` AND confidence = ?`;
        params.push(confidence);
    }

    if (mapId !== undefined) {
        sql += ` AND map_id = ?`;
        params.push(mapId);
    }

    if (search) {
        sql += ` AND (raw_snippet LIKE ? OR map_name LIKE ? OR payload LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    const row = db.prepare(sql).get(...params) as { count: number };
    return row.count;
}

/**
 * Get breakdowns by type and confidence
 */
export function getWorldFactsBreakdowns(): {
    byType: Record<string, number>;
    byConfidence: Record<string, number>;
} {
    const db = getDb();

    const typeRows = db.prepare(`SELECT type, COUNT(*) as count FROM world_facts GROUP BY type`).all() as { type: string; count: number }[];
    const confRows = db.prepare(`SELECT confidence, COUNT(*) as count FROM world_facts GROUP BY confidence`).all() as { confidence: string; count: number }[];

    const byType: Record<string, number> = {};
    typeRows.forEach(r => byType[r.type] = r.count);

    const byConfidence: Record<string, number> = {};
    confRows.forEach(r => byConfidence[r.confidence] = r.count);

    return { byType, byConfidence };
}
