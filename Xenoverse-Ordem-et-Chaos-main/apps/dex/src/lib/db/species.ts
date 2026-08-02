
import { getDb } from './connection';


export interface Species {
    id: string;
    form_id: number;
    name: string;
    form_name: string | null;
    type1: string | null;
    type2: string | null;
    hp: number;
    attack: number;
    defense: number;
    special_attack: number;
    special_defense: number;
    speed: number;
    bst: number;
    ability1: string | null;
    ability2: string | null;
    hidden_ability: string | null;
    has_evolutions: number;
    has_learnset: number;
    is_dev: number;
    dex_number: number | null;
    egg_group1: string | null;
    egg_group2: string | null;
    growth_rate: string | null;
    gender_ratio: string | null;
    catch_rate: number | null;
    base_exp: number | null;
    height: number | null;
    weight: number | null;
    color: string | null;
    shape: string | null;
    habitat: string | null;
    category: string | null;
    pokedex_entry: string | null;
}

export interface SpeciesWithAssets extends Species {
    icon_path: string | null;
    front_path: string | null;
    front_shiny_path: string | null;
    back_path: string | null;
    cry_path: string | null;
}

// Helper to get Xenoverse form name (local to keep simple for now or export if needed)
function _getXenoverseFormName(formId: number): string | null {
    if (formId === 0) return null;
    const formNames: Record<number, string> = {
        1: 'Terrestrial Form',
        2: 'Xenoversal Form',
        3: 'Astral Form',
    };
    return formNames[formId] || `Form ${formId}`;
}

export function getSpeciesList(options: {
    search?: string;
    types?: string[];
    typeMatch?: 'any' | 'all';
    bstMin?: number;
    bstMax?: number;
    hasEvolutions?: boolean;
    hasForms?: boolean;
    hasLearnset?: boolean;
    missingAssets?: boolean;
    baseOnly?: boolean;
    showDev?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
    // Advanced Search
    ability?: string;
    eggGroup?: string;
    move?: string;
}): (SpeciesWithAssets & { display_form_name: string | null })[] {
    const db = getDb();
    if (!db) return [];

    let sql = `
    SELECT 
      s.*,
      a.icon_path,
      a.front_path,
      a.front_shiny_path,
      a.back_path,
      a.cry_path,
      rd.dex_section,
      rd.sort_order
    FROM species s
    LEFT JOIN regional_dex rd ON s.id = rd.species_id
    LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
    WHERE 1=1
  `;
    const params: any[] = [];

    if (!options.showDev) {
        sql += ` AND (s.is_dev = 0 OR s.is_dev IS NULL)`;
    }

    if (options.search) {
        sql += ` AND (s.name LIKE ? OR s.id LIKE ?)`;
        params.push(`%${options.search}%`, `%${options.search}%`);
    }

    if (options.types && options.types.length > 0) {
        if (options.typeMatch === 'all') {
            for (const type of options.types) {
                sql += ` AND (s.type1 = ? OR s.type2 = ?)`;
                params.push(type, type);
            }
        } else {
            const typeConditions = options.types.map(() => `s.type1 = ? OR s.type2 = ?`).join(' OR ');
            sql += ` AND (${typeConditions})`;
            for (const type of options.types) {
                params.push(type, type);
            }
        }
    }

    if (options.bstMin !== undefined) {
        sql += ` AND s.bst >= ?`;
        params.push(options.bstMin);
    }

    if (options.bstMax !== undefined) {
        sql += ` AND s.bst <= ?`;
        params.push(options.bstMax);
    }

    if (options.hasEvolutions !== undefined) {
        sql += ` AND s.has_evolutions = ?`;
        params.push(options.hasEvolutions ? 1 : 0);
    }

    if (options.hasForms !== undefined && options.hasForms) {
        sql += ` AND s.form_id > 0`;
    }

    if (options.baseOnly) {
        sql += ` AND s.form_id = 0`;
    }

    if (options.hasLearnset !== undefined) {
        sql += ` AND s.has_learnset = ?`;
        params.push(options.hasLearnset ? 1 : 0);
    }

    if (options.missingAssets) {
        sql += ` AND (a.icon_path IS NULL OR a.front_path IS NULL)`;
    }

    // Advanced Search Filters
    if (options.ability) {
        const abilityUpper = options.ability.toUpperCase().replace(/[^A-Z0-9]/g, '');
        sql += ` AND (UPPER(REPLACE(s.ability1, ' ', '')) LIKE ? OR UPPER(REPLACE(s.ability2, ' ', '')) LIKE ? OR UPPER(REPLACE(s.hidden_ability, ' ', '')) LIKE ?)`;
        params.push(`%${abilityUpper}%`, `%${abilityUpper}%`, `%${abilityUpper}%`);
    }

    if (options.eggGroup) {
        sql += ` AND (s.egg_group1 = ? OR s.egg_group2 = ?)`;
        params.push(options.eggGroup, options.eggGroup);
    }

    if (options.move) {
        // Subquery to find species that learn the specified move
        const moveUpper = options.move.toUpperCase().replace(/[^A-Z0-9]/g, '');
        sql += ` AND EXISTS (
            SELECT 1 FROM learnsets l 
            WHERE l.species_id = s.id AND l.form_id = s.form_id 
            AND UPPER(REPLACE(l.move_id, ' ', '')) LIKE ?
        )`;
        params.push(`%${moveUpper}%`);
    }

    const sortColumn = {
        'id': 'rd.sort_order',  // Sort by Pokedex number when user selects "ID"
        'dex': 'rd.sort_order',
        'name': 's.name',
        'bst': 's.bst',
        'hp': 's.hp',
        'attack': 's.attack',
        'defense': 's.defense',
        'spa': 's.special_attack',
        'spd': 's.special_defense',
        'spe': 's.speed',
    }[options.sortBy || 'dex'] || 'rd.sort_order';

    const sortOrder = options.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // If sorting by dex or id (default), adhere to section + sort_order.
    // LEFT JOIN means non-dex species have NULL section/sort_order — push those
    // (forms, national-dex-only species) AFTER the game's regional dex order,
    // then by form id then name for a stable order.
    if (sortColumn === 'rd.sort_order') {
        sql += ` ORDER BY (rd.dex_section IS NULL) ${sortOrder}, rd.dex_section ${sortOrder}, rd.sort_order ${sortOrder}, s.form_id ASC, s.name ASC`;
    } else {
        sql += ` ORDER BY ${sortColumn} ${sortOrder}, (rd.dex_section IS NULL) ASC, rd.sort_order ASC, s.form_id ASC, s.name ASC`;
    }

    if (options.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
    }

    if (options.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
    }

    try {
        const results = db.prepare(sql).all(...params) as SpeciesWithAssets[];
        return results.map(species => ({
            ...species,
            display_form_name: species.form_name || _getXenoverseFormName(species.form_id),
        }));
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getSpeciesById(id: string, formId: number = 0): (SpeciesWithAssets & { assets_inherited?: boolean }) | null {
    const db = getDb();
    if (!db) return null;
    if (!id) return null;

    // Query using both id and form_id (composite key)
    const sql = `
    SELECT 
      s.*,
      a.icon_path,
      a.front_path,
      a.front_shiny_path,
      a.back_path,
      a.cry_path
    FROM species s
    LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
    WHERE s.id = ? AND s.form_id = ?
  `;

    try {
        const result = db.prepare(sql).get(id, formId) as SpeciesWithAssets | null;
        if (!result) return null;

        let assetsInherited = false;
        if (result.form_id > 0) {
            const baseId = result.id.split('_')[0];
            const hasOwnAssets = result.front_path || result.icon_path;

            if (!hasOwnAssets) {
                const baseAssetsSql = `
          SELECT icon_path, front_path, front_shiny_path, back_path, cry_path
          FROM assets 
          WHERE species_id = ? AND form_id = 0
        `;
                const baseAssets = db.prepare(baseAssetsSql).get(baseId) as any;

                if (baseAssets) {
                    result.icon_path = result.icon_path || baseAssets.icon_path;
                    result.front_path = result.front_path || baseAssets.front_path;
                    result.front_shiny_path = result.front_shiny_path || baseAssets.front_shiny_path;
                    result.back_path = result.back_path || baseAssets.back_path;
                    result.cry_path = result.cry_path || baseAssets.cry_path;
                    assetsInherited = true;
                }
            }
        }

        return { ...result, assets_inherited: assetsInherited };
    } catch (error) {
        console.error('Query error:', error);
        return null;
    }
}

export function getSpeciesForms(baseId: string): { id: string; form_id: number; name: string; form_name: string | null; display_form_name: string; icon_path: string | null }[] {
    const db = getDb();
    if (!db) return [];

    const baseName = baseId.split('_')[0];
    const sql = `
    SELECT 
      s.id,
      s.form_id,
      s.name,
      s.form_name,
      a.icon_path
    FROM species s
    LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
    WHERE s.id LIKE ? ESCAPE '\\' OR s.id = ?
    ORDER BY s.form_id
  `;

    try {
        const results = db.prepare(sql).all(`${baseName}\\_%`, baseName) as any[];

        const baseForm = results.find(f => f.form_id === 0);
        const baseIconPath = baseForm?.icon_path || null;

        return results.map(form => ({
            ...form,
            icon_path: form.icon_path || (form.form_id > 0 ? baseIconPath : form.icon_path),
            display_form_name: form.form_name || _getXenoverseFormName(form.form_id),
        }));
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getAdjacentSpecies(id: string, formId: number): { prev: SpeciesWithAssets | null; next: SpeciesWithAssets | null } {
    const db = getDb();
    if (!db) return { prev: null, next: null };

    try {
        const prev = db.prepare(`
      SELECT s.*, a.icon_path, a.front_path, a.front_shiny_path, a.back_path, a.cry_path
      FROM species s
      LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
      WHERE (s.id < ? OR (s.id = ? AND s.form_id < ?))
      ORDER BY s.id DESC, s.form_id DESC
      LIMIT 1
    `).get(id, id, formId) as SpeciesWithAssets | null;

        const next = db.prepare(`
      SELECT s.*, a.icon_path, a.front_path, a.front_shiny_path, a.back_path, a.cry_path
      FROM species s
      LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
      WHERE (s.id > ? OR (s.id = ? AND s.form_id > ?))
      ORDER BY s.id ASC, s.form_id ASC
      LIMIT 1
    `).get(id, id, formId) as SpeciesWithAssets | null;

        return { prev, next };
    } catch (error) {
        console.error('Query error:', error);
        return { prev: null, next: null };
    }
}

export function getRandomSpecies(): SpeciesWithAssets | null {
    const db = getDb();
    if (!db) return null;

    try {
        return db.prepare(`
      SELECT s.*, a.icon_path, a.front_path, a.front_shiny_path, a.back_path, a.cry_path
      FROM species s
      LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
      ORDER BY RANDOM()
      LIMIT 1
    `).get() as SpeciesWithAssets | null;
    } catch (error) {
        console.error('Query error:', error);
        return null;
    }
}

export function getEvolutions(speciesId: string, formId: number = 0) {
    const db = getDb();
    if (!db) return [];

    const sql = `
    SELECT 
      species_id,
      form_id,
      target_species as target_id,
      target_form,
      method,
      param as parameter
    FROM evolutions
    WHERE species_id = ? AND form_id = ?
  `;

    try {
        return db.prepare(sql).all(speciesId, formId) as { species_id: string; form_id: number; target_id: string; target_form: number; method: string; parameter: string | number | null }[];
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}

export function getEvolutionFamily(speciesId: string): { species_id: string; form_id: number; target_species: string; target_form: number; method: string; param: string | null }[] {
    const db = getDb();
    if (!db) return [];

    try {
        const allEvolutions = db.prepare(`
      WITH RECURSIVE evo_chain(species_id, form_id, target_species, target_form, method, param, depth) AS (
        SELECT species_id, form_id, target_species, target_form, method, param, 0
        FROM evolutions
        WHERE species_id = ?
        UNION ALL
        SELECT e.species_id, e.form_id, e.target_species, e.target_form, e.method, e.param, c.depth + 1
        FROM evolutions e
        JOIN evo_chain c ON e.species_id = c.target_species
        WHERE c.depth < 5
      )
      SELECT DISTINCT species_id, form_id, target_species, target_form, method, param FROM evo_chain
    `).all(speciesId) as any[];

        return allEvolutions;
    } catch (error) {
        console.error('Query error:', error);
        return [];
    }
}


