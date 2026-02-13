/**
 * Query DSL for Xenoverse Dex
 * Fluent interface for building type-safe database queries
 */

import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'out');
const DB_PATH = join(OUT_DIR, 'dex.db');

/**
 * Query builder base class
 */
class QueryBuilder {
  constructor(db, table, viewName = null) {
    this.db = db;
    this.table = viewName || table;
    this._select = ['*'];
    this._where = [];
    this._params = [];
    this._orderBy = [];
    this._limit = null;
    this._offset = null;
    this._joins = [];
  }
  
  /**
   * Set columns to select
   */
  select(...columns) {
    this._select = columns.length > 0 ? columns : ['*'];
    return this;
  }
  
  /**
   * Add WHERE clause
   */
  where(condition, ...params) {
    this._where.push(condition);
    this._params.push(...params);
    return this;
  }
  
  /**
   * Add WHERE IN clause
   */
  whereIn(column, values) {
    if (values.length === 0) {
      this._where.push('1 = 0'); // Always false
    } else {
      const placeholders = values.map(() => '?').join(', ');
      this._where.push(`${column} IN (${placeholders})`);
      this._params.push(...values);
    }
    return this;
  }
  
  /**
   * Add LIKE clause
   */
  whereLike(column, pattern) {
    this._where.push(`${column} LIKE ?`);
    this._params.push(pattern);
    return this;
  }
  
  /**
   * Add ORDER BY clause
   */
  orderBy(column, direction = 'ASC') {
    this._orderBy.push(`${column} ${direction}`);
    return this;
  }
  
  /**
   * Add LIMIT
   */
  limit(n) {
    this._limit = n;
    return this;
  }
  
  /**
   * Add OFFSET
   */
  offset(n) {
    this._offset = n;
    return this;
  }
  
  /**
   * Add JOIN
   */
  join(table, condition, type = 'INNER') {
    this._joins.push(`${type} JOIN ${table} ON ${condition}`);
    return this;
  }
  
  /**
   * Build SQL string
   */
  toSQL() {
    let sql = `SELECT ${this._select.join(', ')} FROM ${this.table}`;
    
    if (this._joins.length > 0) {
      sql += ' ' + this._joins.join(' ');
    }
    
    if (this._where.length > 0) {
      sql += ' WHERE ' + this._where.join(' AND ');
    }
    
    if (this._orderBy.length > 0) {
      sql += ' ORDER BY ' + this._orderBy.join(', ');
    }
    
    if (this._limit !== null) {
      sql += ` LIMIT ${this._limit}`;
    }
    
    if (this._offset !== null) {
      sql += ` OFFSET ${this._offset}`;
    }
    
    return sql;
  }
  
  /**
   * Execute and get all results
   */
  all() {
    const sql = this.toSQL();
    return this.db.prepare(sql).all(...this._params);
  }
  
  /**
   * Execute and get first result
   */
  first() {
    this._limit = 1;
    const sql = this.toSQL();
    return this.db.prepare(sql).get(...this._params);
  }
  
  /**
   * Get count of matching rows
   */
  count() {
    const originalSelect = this._select;
    this._select = ['COUNT(*) as count'];
    const sql = this.toSQL();
    this._select = originalSelect;
    return this.db.prepare(sql).get(...this._params)?.count || 0;
  }
  
  /**
   * Check if any matching rows exist
   */
  exists() {
    return this.count() > 0;
  }
  
  /**
   * Get paginated results
   */
  paginate(page = 1, perPage = 20) {
    const total = this.count();
    const totalPages = Math.ceil(total / perPage);
    
    this._limit = perPage;
    this._offset = (page - 1) * perPage;
    
    return {
      data: this.all(),
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    };
  }
}

/**
 * Species-specific query builder
 */
class SpeciesQuery extends QueryBuilder {
  constructor(db) {
    super(db, 'species', 'species_with_tiers');
  }
  
  /**
   * Filter by type (either type1 or type2)
   */
  ofType(type) {
    this._where.push('(type1 = ? OR type2 = ?)');
    this._params.push(type.toUpperCase(), type.toUpperCase());
    return this;
  }
  
  /**
   * Filter by dual type
   */
  ofTypes(type1, type2) {
    this._where.push('((type1 = ? AND type2 = ?) OR (type1 = ? AND type2 = ?))');
    this._params.push(type1.toUpperCase(), type2.toUpperCase(), type2.toUpperCase(), type1.toUpperCase());
    return this;
  }
  
  /**
   * Filter by ability
   */
  withAbility(ability) {
    const abilityUpper = ability.toUpperCase();
    this._where.push('(ability1 = ? OR ability2 = ? OR hidden_ability = ?)');
    this._params.push(abilityUpper, abilityUpper, abilityUpper);
    return this;
  }
  
  /**
   * Filter by BST range
   */
  bstBetween(min, max) {
    this._where.push('bst >= ? AND bst <= ?');
    this._params.push(min, max);
    return this;
  }
  
  /**
   * Filter by BST tier
   */
  bstTier(tier) {
    this._where.push('bst_tier = ?');
    this._params.push(tier);
    return this;
  }
  
  /**
   * Filter by speed tier
   */
  speedTier(tier) {
    this._where.push('speed_tier = ?');
    this._params.push(tier);
    return this;
  }
  
  /**
   * Filter by stat minimum
   */
  statMin(stat, value) {
    const validStats = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'];
    if (!validStats.includes(stat)) {
      throw new Error(`Invalid stat: ${stat}. Must be one of: ${validStats.join(', ')}`);
    }
    this._where.push(`${stat} >= ?`);
    this._params.push(value);
    return this;
  }
  
  /**
   * Filter by egg group
   */
  inEggGroup(group) {
    this._where.push('(egg_group1 = ? OR egg_group2 = ?)');
    this._params.push(group, group);
    return this;
  }
  
  /**
   * Only base forms (no alternate forms)
   */
  baseForms() {
    this._where.push('form_id = 0');
    return this;
  }
  
  /**
   * Only species that can evolve
   */
  canEvolve() {
    this._where.push('has_evolutions = 1');
    return this;
  }
  
  /**
   * Only fully evolved species
   */
  fullyEvolved() {
    this._where.push('has_evolutions = 0');
    return this;
  }
  
  /**
   * Search by name (partial match)
   */
  named(pattern) {
    this._where.push('name LIKE ?');
    this._params.push(`%${pattern}%`);
    return this;
  }
}

/**
 * Moves-specific query builder
 */
class MovesQuery extends QueryBuilder {
  constructor(db) {
    super(db, 'moves');
  }
  
  /**
   * Filter by type
   */
  ofType(type) {
    this._where.push('type = ?');
    this._params.push(type.toUpperCase());
    return this;
  }
  
  /**
   * Filter by category
   */
  ofCategory(category) {
    this._where.push('category = ?');
    this._params.push(category);
    return this;
  }
  
  /**
   * Filter by power range
   */
  powerBetween(min, max) {
    this._where.push('power >= ? AND power <= ?');
    this._params.push(min, max);
    return this;
  }
  
  /**
   * Only physical moves
   */
  physical() {
    return this.ofCategory('Physical');
  }
  
  /**
   * Only special moves
   */
  special() {
    return this.ofCategory('Special');
  }
  
  /**
   * Only status moves
   */
  status() {
    return this.ofCategory('Status');
  }
  
  /**
   * Priority moves only
   */
  priority() {
    this._where.push('priority > 0');
    return this;
  }
  
  /**
   * Search by name
   */
  named(pattern) {
    this._where.push('name LIKE ?');
    this._params.push(`%${pattern}%`);
    return this;
  }
}

/**
 * Evolution-specific query builder
 */
class EvolutionQuery extends QueryBuilder {
  constructor(db) {
    super(db, 'evolutions');
  }
  
  /**
   * Filter by evolution method
   */
  byMethod(method) {
    this._where.push('method = ?');
    this._params.push(method);
    return this;
  }
  
  /**
   * Get evolution chain for a species
   */
  forSpecies(speciesId, formId = 0) {
    this._where.push('species_id = ? AND form_id = ?');
    this._params.push(speciesId.toUpperCase(), formId);
    return this;
  }
  
  /**
   * Get what evolves into this species
   */
  evolvesInto(targetSpecies, targetForm = 0) {
    this._where.push('target_species = ? AND target_form = ?');
    this._params.push(targetSpecies.toUpperCase(), targetForm);
    return this;
  }
}

/**
 * Learnset-specific query builder
 */
class LearnsetQuery extends QueryBuilder {
  constructor(db) {
    super(db, 'learnsets');
  }
  
  /**
   * Filter by species
   */
  forSpecies(speciesId, formId = 0) {
    this._where.push('species_id = ? AND form_id = ?');
    this._params.push(speciesId.toUpperCase(), formId);
    return this;
  }
  
  /**
   * Filter by move
   */
  withMove(moveId) {
    this._where.push('move_id = ?');
    this._params.push(moveId.toUpperCase());
    return this;
  }
  
  /**
   * Filter by learn method
   */
  byMethod(method) {
    this._where.push('learn_method = ?');
    this._params.push(method);
    return this;
  }
  
  /**
   * Level-up moves only
   */
  levelUp() {
    return this.byMethod('level_up');
  }
  
  /**
   * TM moves only
   */
  tm() {
    return this.byMethod('tm');
  }
  
  /**
   * Tutor moves only
   */
  tutor() {
    return this.byMethod('tutor');
  }
  
  /**
   * Egg moves only
   */
  egg() {
    return this.byMethod('egg');
  }
  
  /**
   * Get full move details with join
   */
  withMoveDetails() {
    this._select = [
      'learnsets.*',
      'moves.name as move_name',
      'moves.type as move_type',
      'moves.category',
      'moves.power',
      'moves.accuracy',
      'moves.pp'
    ];
    this.join('moves', 'learnsets.move_id = moves.id');
    return this;
  }
}

/**
 * Main Dex Query interface
 */
export class DexQuery {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this._db = null;
  }
  
  /**
   * Get database connection (lazy)
   */
  get db() {
    if (!this._db) {
      this._db = new Database(this.dbPath, { readonly: true });
    }
    return this._db;
  }
  
  /**
   * Close connection
   */
  close() {
    if (this._db) {
      this._db.close();
      this._db = null;
    }
  }
  
  /**
   * Start species query
   */
  species() {
    return new SpeciesQuery(this.db);
  }
  
  /**
   * Start moves query
   */
  moves() {
    return new MovesQuery(this.db);
  }
  
  /**
   * Start evolution query
   */
  evolutions() {
    return new EvolutionQuery(this.db);
  }
  
  /**
   * Start learnset query
   */
  learnsets() {
    return new LearnsetQuery(this.db);
  }
  
  /**
   * Raw query
   */
  raw(sql, ...params) {
    return this.db.prepare(sql).all(...params);
  }
  
  /**
   * Get species by ID
   */
  getSpecies(id, formId = 0) {
    return this.species()
      .where('id = ? AND form_id = ?', id.toUpperCase(), formId)
      .first();
  }
  
  /**
   * Get move by ID
   */
  getMove(id) {
    return this.moves()
      .where('id = ?', id.toUpperCase())
      .first();
  }
  
  /**
   * Get ability by ID
   */
  getAbility(id) {
    return this.db.prepare('SELECT * FROM abilities WHERE id = ?').get(id.toUpperCase());
  }
  
  /**
   * Get type by ID
   */
  getType(id) {
    return this.db.prepare('SELECT * FROM types WHERE id = ?').get(id.toUpperCase());
  }
  
  /**
   * Get full evolution family for a species
   */
  getEvolutionFamily(speciesId) {
    const family = this.db.prepare(`
      SELECT ef.*, s.name, s.type1, s.type2, s.bst
      FROM evolution_families ef
      JOIN species s ON ef.species_id = s.id AND ef.form_id = s.form_id
      WHERE ef.family_id = (
        SELECT family_id FROM evolution_families 
        WHERE species_id = ?
        LIMIT 1
      )
      ORDER BY ef.stage, ef.position_in_stage
    `).all(speciesId.toUpperCase());
    
    return family;
  }
  
  /**
   * Get all species that can learn a specific move
   */
  getSpeciesWithMove(moveId) {
    return this.db.prepare(`
      SELECT DISTINCT s.*
      FROM species s
      JOIN move_species ms ON s.id = ms.species_id AND s.form_id = ms.form_id
      WHERE ms.move_id = ?
    `).all(moveId.toUpperCase());
  }
  
  /**
   * Get all species with a specific ability
   */
  getSpeciesWithAbility(abilityId) {
    return this.db.prepare(`
      SELECT DISTINCT s.*, asa.is_hidden
      FROM species s
      JOIN ability_species asa ON s.id = asa.species_id AND s.form_id = asa.form_id
      WHERE asa.ability_id = ?
    `).all(abilityId.toUpperCase());
  }
  
  /**
   * Get stats summary
   */
  getStats() {
    return {
      species: this.db.prepare('SELECT COUNT(*) as count FROM species').get().count,
      moves: this.db.prepare('SELECT COUNT(*) as count FROM moves').get().count,
      types: this.db.prepare('SELECT COUNT(*) as count FROM types').get().count,
      abilities: this.db.prepare('SELECT COUNT(*) as count FROM abilities').get().count,
      evolutions: this.db.prepare('SELECT COUNT(*) as count FROM evolutions').get().count,
      learnsets: this.db.prepare('SELECT COUNT(*) as count FROM learnsets').get().count,
      evolutionFamilies: this.db.prepare('SELECT COUNT(DISTINCT family_id) as count FROM evolution_families').get().count
    };
  }
}

/**
 * Create new DexQuery instance
 */
export function createQuery(dbPath = DB_PATH) {
  return new DexQuery(dbPath);
}

// CLI demo
if (process.argv[1].includes('query')) {
  const dex = createQuery();
  
  console.log('=== Query DSL Demo ===\n');
  
  // Stats
  console.log('Database stats:', dex.getStats());
  console.log('');
  
  // Example queries
  console.log('Fire type Pokemon (first 5):');
  const fireTypes = dex.species()
    .ofType('FIRE')
    .baseForms()
    .orderBy('bst', 'DESC')
    .limit(5)
    .all();
  fireTypes.forEach(s => console.log(`  ${s.name} (BST: ${s.bst})`));
  console.log('');
  
  console.log('High-power moves (100+):');
  const strongMoves = dex.moves()
    .powerBetween(100, 999)
    .orderBy('power', 'DESC')
    .limit(5)
    .all();
  strongMoves.forEach(m => console.log(`  ${m.name} (${m.type}, ${m.power} power)`));
  console.log('');
  
  console.log('Ultra-fast species:');
  const fastOnes = dex.species()
    .speedTier('ultra-fast')
    .baseForms()
    .limit(5)
    .all();
  fastOnes.forEach(s => console.log(`  ${s.name} (Speed: ${s.speed})`));
  
  dex.close();
}

export default {
  DexQuery,
  createQuery,
  QueryBuilder,
  SpeciesQuery,
  MovesQuery,
  EvolutionQuery,
  LearnsetQuery
};
