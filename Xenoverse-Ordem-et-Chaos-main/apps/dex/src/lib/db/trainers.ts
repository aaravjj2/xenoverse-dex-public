import { getDb } from './connection';

// Boss trainer types: Gym Leaders, Rivals, Story Bosses, Team Bosses
export const BOSS_TRAINER_TYPES = [
    // Gym Leaders
    'LEADER_Basil', 'LEADER_Ginger', 'LEADER_Nuphar', 'LEADER_Vanilla',
    // Rivals
    'Rival_ALICE', 'Rival_KAY', 'ALICE', 'KAY', 'ALTER_ALICE', 'ALTER_KAY',
    // Story Bosses
    'CLOVER', 'TREY', 'RUTA',
    // Team Bosses
    'TEAMDIMENSIONELITE', 'KNIGHTCAPTAIN'
] as const;

// Category labels for boss types
export function getBossCategory(trainerType: string): string | null {
    if (trainerType.startsWith('LEADER_')) return 'Gym Leader';
    if (trainerType.startsWith('Rival_') || ['ALICE', 'KAY', 'ALTER_ALICE', 'ALTER_KAY'].includes(trainerType)) return 'Rival';
    if (['CLOVER', 'TREY', 'RUTA'].includes(trainerType)) return 'Story Boss';
    if (['TEAMDIMENSIONELITE', 'KNIGHTCAPTAIN'].includes(trainerType)) return 'Team Boss';
    return null;
}

/**
 * Get trainers list with filtering
 */
export interface GetTrainersOptions {
    search?: string;
    trainerType?: string;
    mapId?: number;
    limit?: number;
    offset?: number;
    bossOnly?: boolean; // Only show boss fights (gym leaders, rivals, story bosses)
}


export interface TrainerPartyMember {
    slot: number;
    speciesId: string;
    level: number;
    moves: string[];
    abilityIndex: number;
    item: string | null;
    nature: string | null;
    gender: string | null;
    form: number;
    // Joined fields
    speciesName?: string;
    type1?: string | null;
    type2?: string | null;
    iconPath?: string | null;
}

export interface Trainer {
    id: string;
    trainerType: string;
    name: string;
    version: number;
    items: string[];
    loseText: string | null;
    partyCount: number;
    party?: TrainerPartyMember[];
    // Location from world facts
    mapId?: number;
    mapName?: string;
}

export function getTrainersList(options: GetTrainersOptions = {}): Trainer[] {
    const db = getDb();
    const { search, trainerType, mapId, limit = 200, offset = 0, bossOnly = false } = options;

    // Use a subquery to get the best matching world_fact for each trainer
    // Priority: trainerId match > trainerType match (for intro-only facts)
    // GROUP BY to ensure one row per trainer per location
    let sql = `
    SELECT 
      t.id, t.trainer_type, t.name, t.version, t.items, t.lose_text, t.party_count,
      best_match.map_id, best_match.map_name
    FROM trainers t
    LEFT JOIN (
      SELECT 
        COALESCE(json_extract(wf.payload, '$.trainerId'), json_extract(wf.payload, '$.trainerType')) as match_key,
        wf.map_id, 
        wf.map_name,
        json_extract(wf.payload, '$.trainerId') as trainer_id,
        json_extract(wf.payload, '$.trainerType') as trainer_type_match,
        json_extract(wf.payload, '$.trainerName') as trainer_name_match
      FROM world_facts wf
      WHERE wf.type = 'trainer_location'
      GROUP BY COALESCE(json_extract(wf.payload, '$.trainerId'), json_extract(wf.payload, '$.trainerType')), wf.map_id
    ) best_match ON (
      best_match.trainer_id = t.id
      OR 
      (best_match.trainer_type_match = t.trainer_type AND best_match.trainer_name_match = t.name)
      OR
      (
        best_match.trainer_name_match IS NULL AND 
        best_match.trainer_type_match = UPPER(REPLACE(REPLACE(REPLACE(t.trainer_type, 'LEADER_', ''), 'Rival_', ''), 'ALTER_', ''))
      )
      OR
      (best_match.trainer_id IS NULL AND best_match.trainer_type_match = t.trainer_type)
    )
    WHERE 1=1
  `;

    const params: (string | number)[] = [];

    // Filter to boss trainers only (gym leaders, rivals, story bosses)
    if (bossOnly) {
        const placeholders = BOSS_TRAINER_TYPES.map(() => '?').join(',');
        sql += ` AND t.trainer_type IN (${placeholders})`;
        params.push(...BOSS_TRAINER_TYPES);
    }

    if (search) {
        sql += ` AND (t.name LIKE ? OR t.trainer_type LIKE ? OR best_match.map_name LIKE ?)`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
    }

    if (trainerType) {
        sql += ` AND t.trainer_type = ?`;
        params.push(trainerType);
    }


    if (mapId !== undefined) {
        sql += ` AND best_match.map_id = ?`;
        params.push(mapId);
    }

    // Group by trainer to avoid duplicates, sort by map_id (NULL last)
    sql += ` GROUP BY t.id, best_match.map_id ORDER BY COALESCE(best_match.map_id, 99999), best_match.map_name, t.name LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params) as any[];

    return rows.map(row => ({
        id: row.id,
        trainerType: row.trainer_type,
        name: row.name,
        version: row.version,
        items: JSON.parse(row.items || '[]'),
        loseText: row.lose_text,
        partyCount: row.party_count,
        mapId: row.map_id || null,
        mapName: row.map_name || null
    }));
}


/**
 * Get a single trainer by ID with full party details
 */
export function getTrainer(id: string): Trainer | null {
    const db = getDb();

    const row = db.prepare(`
    SELECT id, trainer_type, name, version, items, lose_text, party_count
    FROM trainers
    WHERE id = ?
  `).get(id) as any;

    if (!row) return null;

    // Get party members with species details
    const partyRows = db.prepare(`
    SELECT 
      tp.slot, tp.species_id, tp.level, tp.moves, tp.ability_index, tp.item, tp.nature, tp.gender, tp.form,
      s.name as species_name, s.type1, s.type2,
      a.icon_path
    FROM trainer_party tp
    LEFT JOIN species s ON s.id = tp.species_id AND s.form_id = tp.form
    LEFT JOIN assets a ON a.species_id = tp.species_id AND a.form_id = tp.form
    WHERE tp.trainer_id = ?
    ORDER BY tp.slot
  `).all(id) as any[];

    const party: TrainerPartyMember[] = partyRows.map(p => ({
        slot: p.slot,
        speciesId: p.species_id,
        level: p.level,
        moves: JSON.parse(p.moves || '[]'),
        abilityIndex: p.ability_index,
        item: p.item,
        nature: p.nature,
        gender: p.gender,
        form: p.form,
        speciesName: p.species_name || p.species_id,
        type1: p.type1,
        type2: p.type2,
        iconPath: p.icon_path
    }));

    return {
        id: row.id,
        trainerType: row.trainer_type,
        name: row.name,
        version: row.version,
        items: JSON.parse(row.items || '[]'),
        loseText: row.lose_text,
        partyCount: row.party_count,
        party
    };
}

/**
 * Get world facts related to a trainer (battle locations)
 */
export function getTrainerLocations(trainerId: string): any[] {
    const db = getDb();

    const rows = db.prepare(`
    SELECT id, type, map_id, map_name, payload, confidence, reason
    FROM world_facts
    WHERE type = 'trainer_location'
      AND json_extract(payload, '$.trainerId') = ?
  `).all(trainerId) as any[];

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
 * Get unique trainer types for filtering
 */
export function getTrainerTypes(): string[] {
    const db = getDb();

    const rows = db.prepare(`
    SELECT DISTINCT trainer_type FROM trainers ORDER BY trainer_type
  `).all() as any[];

    return rows.map(r => r.trainer_type);
}

/**
 * Trainer grouped by route/location
 */
export interface TrainerRouteGroup {
    mapId: number | null;
    mapName: string | null;
    trainers: Trainer[];
}

/**
 * Get trainers grouped by route/location for the route-first display
 */
export function getTrainersGroupedByRoute(options: GetTrainersOptions = {}): TrainerRouteGroup[] {
    const trainers = getTrainersList({ ...options, limit: 500 });

    // Group by mapId
    const groups = new Map<string, TrainerRouteGroup>();

    for (const trainer of trainers) {
        const key = trainer.mapId !== null ? String(trainer.mapId) : 'unknown';

        if (!groups.has(key)) {
            groups.set(key, {
                mapId: trainer.mapId ?? null,
                mapName: trainer.mapName ?? null,
                trainers: []
            });
        }

        groups.get(key)!.trainers.push(trainer);
    }

    // Sort: routes with mapId first (by mapId), then unknown last
    const sorted = Array.from(groups.values()).sort((a, b) => {
        if (a.mapId === null && b.mapId !== null) return 1;
        if (a.mapId !== null && b.mapId === null) return -1;
        if (a.mapId !== null && b.mapId !== null) return a.mapId - b.mapId;
        return 0;
    });

    return sorted;
}
