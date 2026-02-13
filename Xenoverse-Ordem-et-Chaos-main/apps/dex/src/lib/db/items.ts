import { getDb } from './connection';
import { getReachableMaps } from '../mapGraph';
import { getWorldFactMaps } from './world';

/**
 * Get items list with filtering and pagination
 */
export interface GetItemsOptions {
    search?: string;
    pocket?: number;
    milestone?: string; // Filter items by reachability milestone
    limit?: number;
    offset?: number;
}

export interface Item {
    id: string;
    name: string;
    namePlural: string | null;
    pocket: number;
    price: number;
    sellPrice: number;
    bpPrice: number;
    fieldUse: number;
    battleUse: number;
    flags: string[];
    consumable: boolean;
    showQuantity: number | null;
    move: string | null;
    description: string;
}

export function getItemsList(options: GetItemsOptions = {}): Item[] {
    const db = getDb();
    const { search, pocket, milestone, limit = 100, offset = 0 } = options;

    // Get reachable maps if milestone is provided
    let reachableMapIds: number[] | null = null;
    if (milestone) {
        try {
            const allMaps = getWorldFactMaps();
            const milestoneMap = allMaps.find(m => 
                m.mapName?.toLowerCase().replace(/\s+/g, '-') === milestone.toLowerCase()
            );
            if (milestoneMap) {
                const START_MAP = 2;
                const reachableMaps = getReachableMaps([START_MAP, milestoneMap.mapId]);
                reachableMapIds = Array.from(reachableMaps);
            }
        } catch (error) {
            console.error('Error getting reachable maps:', error);
        }
    }

    let sql = `
    SELECT DISTINCT i.id, i.name, i.name_plural, i.pocket, i.price, i.sell_price, i.bp_price,
           i.field_use, i.battle_use, i.flags, i.consumable, i.show_quantity, i.move, i.description
    FROM items i
    WHERE 1=1
  `;

    const params: (string | number)[] = [];

    if (search) {
        sql += ` AND (i.name LIKE ? OR i.id LIKE ? OR i.description LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    if (pocket !== undefined) {
        sql += ` AND i.pocket = ?`;
        params.push(pocket);
    }

    // Filter by milestone reachability
    if (reachableMapIds && reachableMapIds.length > 0) {
        sql += ` AND EXISTS (
            SELECT 1 FROM world_facts wf 
            WHERE wf.fact_value LIKE '%' || i.id || '%'
            AND wf.map_id IN (${reachableMapIds.join(',')})
        )`;
    }

    sql += ` ORDER BY i.name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map(row => ({
        id: row.id,
        name: row.name,
        namePlural: row.name_plural,
        pocket: row.pocket,
        price: row.price,
        sellPrice: row.sell_price,
        bpPrice: row.bp_price,
        fieldUse: row.field_use,
        battleUse: row.battle_use,
        flags: JSON.parse(row.flags || '[]'),
        consumable: !!row.consumable,
        showQuantity: row.show_quantity,
        move: row.move,
        description: row.description
    }));
}

/**
 * Get items count with filtering (for pagination)
 */
export function getItemsCount(options: GetItemsOptions = {}): number {
    const db = getDb();
    const { search, pocket, milestone } = options;

    // Get reachable maps if milestone is provided
    let reachableMapIds: number[] | null = null;
    if (milestone) {
        try {
            const allMaps = getWorldFactMaps();
            const milestoneMap = allMaps.find(m => 
                m.mapName?.toLowerCase().replace(/\s+/g, '-') === milestone.toLowerCase()
            );
            if (milestoneMap) {
                const START_MAP = 2;
                const reachableMaps = getReachableMaps([START_MAP, milestoneMap.mapId]);
                reachableMapIds = Array.from(reachableMaps);
            }
        } catch (error) {
            console.error('Error getting reachable maps:', error);
        }
    }

    let sql = `SELECT COUNT(DISTINCT i.id) as count FROM items i WHERE 1=1`;
    const params: (string | number)[] = [];

    if (search) {
        sql += ` AND (i.name LIKE ? OR i.id LIKE ? OR i.description LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    if (pocket !== undefined) {
        sql += ` AND i.pocket = ?`;
        params.push(pocket);
    }

    // Filter by milestone reachability
    if (reachableMapIds && reachableMapIds.length > 0) {
        sql += ` AND EXISTS (
            SELECT 1 FROM world_facts wf 
            WHERE wf.fact_value LIKE '%' || i.id || '%'
            AND wf.map_id IN (${reachableMapIds.join(',')})
        )`;
    }

    const result = db.prepare(sql).get(...params) as { count: number };
    return result.count;
}

/**
 * Get a single item by ID
 */
export function getItem(id: string): Item | null {
    const db = getDb();

    const row = db.prepare(`
    SELECT id, name, name_plural, pocket, price, sell_price, bp_price,
           field_use, battle_use, flags, consumable, show_quantity, move, description
    FROM items
    WHERE id = ?
  `).get(id) as any;

    if (!row) return null;

    return {
        id: row.id,
        name: row.name,
        namePlural: row.name_plural,
        pocket: row.pocket,
        price: row.price,
        sellPrice: row.sell_price,
        bpPrice: row.bp_price,
        fieldUse: row.field_use,
        battleUse: row.battle_use,
        flags: JSON.parse(row.flags || '[]'),
        consumable: !!row.consumable,
        showQuantity: row.show_quantity,
        move: row.move,
        description: row.description
    };
}

/**
 * Get world facts related to an item (locations where found)
 */
export function getItemLocations(itemId: string): any[] {
    const db = getDb();

    const rows = db.prepare(`
    SELECT id, type, map_id, map_name, payload, confidence, reason
    FROM world_facts
    WHERE (type = 'item_location' OR type = 'hidden_item' OR type = 'shop')
      AND json_extract(payload, '$.itemId') = ?
         OR (type = 'shop' AND instr(payload, ?) > 0)
  `).all(itemId, itemId) as any[];

    return rows.map(row => ({
        id: row.id,
        type: row.type,
        mapId: row.map_id,
        mapName: row.map_name,
        payload: JSON.parse(row.payload || '{}'),
        confidence: row.confidence,
        reason: row.reason
    }));
}

/**
 * Get pocket names mapping
 */
export const POCKET_NAMES: Record<number, string> = {
    0: 'Unknown',
    1: 'Items',
    2: 'Medicine',
    3: 'Poké Balls',
    4: 'TMs & HMs',
    5: 'Berries',
    6: 'Mail',
    7: 'Battle Items',
    8: 'Key Items'
};
