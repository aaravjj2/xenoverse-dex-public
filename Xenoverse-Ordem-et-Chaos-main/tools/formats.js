/**
 * Export Formats for Xenoverse Dex
 * Exports data in multiple formats with schema versioning
 */

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'out');
const DB_PATH = join(OUT_DIR, 'dex.db');

// Schema version for exported data
const SCHEMA_VERSION = '1.0.0';

/**
 * Export data to JSON format
 */
export function exportJSON(db, outputDir, options = {}) {
  const { pretty = true, includeMetadata = true } = options;
  
  console.log('Exporting to JSON...');
  mkdirSync(outputDir, { recursive: true });
  
  const tables = ['species', 'moves', 'types', 'abilities'];
  const exports = {};
  
  for (const table of tables) {
    const data = db.prepare(`SELECT * FROM ${table}`).all();
    
    const output = includeMetadata ? {
      $schema: `xenoverse-dex/${table}/v${SCHEMA_VERSION}`,
      version: SCHEMA_VERSION,
      exportTime: new Date().toISOString(),
      count: data.length,
      data
    } : data;
    
    const filepath = join(outputDir, `${table}.json`);
    writeFileSync(filepath, JSON.stringify(output, null, pretty ? 2 : 0));
    exports[table] = { path: filepath, count: data.length };
    console.log(`  ${table}.json: ${data.length} records`);
  }
  
  return exports;
}

/**
 * Export data to CSV format
 */
export function exportCSV(db, outputDir, options = {}) {
  const { delimiter = ',' } = options;
  
  console.log('Exporting to CSV...');
  mkdirSync(outputDir, { recursive: true });
  
  const tables = {
    species: `
      SELECT id, form_id, name, form_name, type1, type2,
             hp, attack, defense, special_attack, special_defense, speed, bst,
             ability1, ability2, hidden_ability,
             egg_group1, egg_group2, growth_rate, catch_rate, base_exp
      FROM species
      ORDER BY id, form_id
    `,
    moves: `
      SELECT id, name, type, category, power, accuracy, pp, priority, target, description
      FROM moves
      ORDER BY id
    `,
    types: `
      SELECT id, name, is_pseudo_type, is_special_type
      FROM types
      ORDER BY id
    `,
    abilities: `
      SELECT id, name, description
      FROM abilities
      ORDER BY id
    `
  };
  
  const exports = {};
  
  for (const [table, query] of Object.entries(tables)) {
    const stmt = db.prepare(query);
    const data = stmt.all();
    
    if (data.length === 0) {
      console.log(`  ${table}.csv: no data`);
      continue;
    }
    
    const columns = Object.keys(data[0]);
    const header = columns.join(delimiter);
    
    const rows = data.map(row => 
      columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        if (str.includes(delimiter) || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(delimiter)
    );
    
    const csv = [header, ...rows].join('\n');
    const filepath = join(outputDir, `${table}.csv`);
    writeFileSync(filepath, csv);
    exports[table] = { path: filepath, count: data.length };
    console.log(`  ${table}.csv: ${data.length} records`);
  }
  
  return exports;
}

/**
 * Export data to TypeScript definitions
 */
export function exportTypeScript(db, outputDir) {
  console.log('Exporting TypeScript definitions...');
  mkdirSync(outputDir, { recursive: true });
  
  // Get types for enum
  const types = db.prepare('SELECT id, name FROM types ORDER BY id').all();
  
  // Get abilities for enum
  const abilities = db.prepare('SELECT id, name FROM abilities ORDER BY id').all();
  
  const ts = `/**
 * Xenoverse Dex TypeScript Definitions
 * Generated: ${new Date().toISOString()}
 * Schema Version: ${SCHEMA_VERSION}
 */

// Type enum
export type PokemonType = ${types.map(t => `'${t.id}'`).join(' | ')};

// Move category
export type MoveCategory = 'Physical' | 'Special' | 'Status';

// Stats
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  special_attack: number;
  special_defense: number;
  speed: number;
}

// Species
export interface Species {
  id: string;
  form_id: number;
  name: string;
  form_name: string | null;
  type1: PokemonType;
  type2: PokemonType | null;
  stats: Stats;
  bst: number;
  ability1: string | null;
  ability2: string | null;
  hidden_ability: string | null;
  egg_group1: string | null;
  egg_group2: string | null;
  growth_rate: string | null;
  catch_rate: number | null;
  base_exp: number | null;
  has_evolutions: boolean;
  has_learnset: boolean;
}

// Move
export interface Move {
  id: string;
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: string | null;
  description: string | null;
}

// Evolution
export interface Evolution {
  species_id: string;
  form_id: number;
  target_species: string;
  target_form: number;
  method: string | null;
  param: string | null;
}

// Learnset Entry
export interface LearnsetEntry {
  species_id: string;
  form_id: number;
  move_id: string;
  learn_method: 'level_up' | 'tm' | 'tutor' | 'egg' | 'special';
  level: number | null;
}

// Type
export interface Type {
  id: PokemonType;
  name: string;
  is_pseudo_type: boolean;
  is_special_type: boolean;
  weaknesses: PokemonType[];
  resistances: PokemonType[];
  immunities: PokemonType[];
}

// Ability
export interface Ability {
  id: string;
  name: string;
  description: string | null;
}

// Type IDs
export const TypeIds = [${types.map(t => `'${t.id}'`).join(', ')}] as const;

// Ability count
export const AbilityCount = ${abilities.length};

// Schema version
export const SchemaVersion = '${SCHEMA_VERSION}';
`;
  
  const filepath = join(outputDir, 'dex.d.ts');
  writeFileSync(filepath, ts);
  console.log(`  dex.d.ts generated`);
  
  return { path: filepath };
}

/**
 * Export showdown-compatible format
 */
export function exportShowdown(db, outputDir) {
  console.log('Exporting Showdown format...');
  mkdirSync(outputDir, { recursive: true });
  
  const species = db.prepare(`
    SELECT * FROM species WHERE form_id = 0 ORDER BY id
  `).all();
  
  const pokedex = {};
  
  for (const sp of species) {
    const id = sp.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    pokedex[id] = {
      num: sp.dex_number || 0,
      name: sp.name,
      types: [sp.type1, sp.type2].filter(Boolean),
      baseStats: {
        hp: sp.hp,
        atk: sp.attack,
        def: sp.defense,
        spa: sp.special_attack,
        spd: sp.special_defense,
        spe: sp.speed
      },
      abilities: {
        0: sp.ability1 || '',
        ...(sp.ability2 ? { 1: sp.ability2 } : {}),
        ...(sp.hidden_ability ? { H: sp.hidden_ability } : {})
      },
      heightm: sp.height ? sp.height / 10 : 0,
      weightkg: sp.weight ? sp.weight / 10 : 0,
      color: sp.color || 'Gray',
      eggGroups: [sp.egg_group1, sp.egg_group2].filter(Boolean)
    };
  }
  
  const filepath = join(outputDir, 'pokedex.js');
  writeFileSync(filepath, `exports.Pokedex = ${JSON.stringify(pokedex, null, 2)};`);
  console.log(`  pokedex.js: ${Object.keys(pokedex).length} species`);
  
  return { path: filepath, count: Object.keys(pokedex).length };
}

/**
 * Export SQLite dump
 */
export function exportSQLDump(dbPath, outputDir) {
  console.log('Exporting SQL dump...');
  mkdirSync(outputDir, { recursive: true });
  
  const db = new Database(dbPath, { readonly: true });
  
  const lines = [];
  lines.push('-- Xenoverse Dex SQL Dump');
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Schema Version: ${SCHEMA_VERSION}`);
  lines.push('');
  
  // Get all tables
  const tables = db.prepare(`
    SELECT name, sql FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  for (const { name, sql } of tables) {
    lines.push(`-- Table: ${name}`);
    lines.push(`DROP TABLE IF EXISTS ${name};`);
    lines.push(sql + ';');
    lines.push('');
    
    // Export data
    const rows = db.prepare(`SELECT * FROM ${name}`).all();
    if (rows.length > 0) {
      const columns = Object.keys(rows[0]);
      for (const row of rows) {
        const values = columns.map(col => {
          const val = row[col];
          if (val === null) return 'NULL';
          if (typeof val === 'number') return val;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        lines.push(`INSERT INTO ${name} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
      }
      lines.push('');
    }
  }
  
  db.close();
  
  const filepath = join(outputDir, 'dex.sql');
  writeFileSync(filepath, lines.join('\n'));
  console.log(`  dex.sql: ${tables.length} tables`);
  
  return { path: filepath };
}

/**
 * Export all formats
 */
export function exportAll(dbPath = DB_PATH, outputDir = join(OUT_DIR, 'exports')) {
  console.log('='.repeat(60));
  console.log('EXPORT ALL FORMATS');
  console.log('='.repeat(60));
  console.log(`Schema Version: ${SCHEMA_VERSION}`);
  console.log('');
  
  const db = new Database(dbPath, { readonly: true });
  const results = {};
  
  try {
    results.json = exportJSON(db, join(outputDir, 'json'));
    console.log('');
    
    results.csv = exportCSV(db, join(outputDir, 'csv'));
    console.log('');
    
    results.typescript = exportTypeScript(db, join(outputDir, 'typescript'));
    console.log('');
    
    results.showdown = exportShowdown(db, join(outputDir, 'showdown'));
    console.log('');
  } finally {
    db.close();
  }
  
  results.sql = exportSQLDump(dbPath, join(outputDir, 'sql'));
  
  console.log('');
  console.log('Export complete!');
  console.log(`Output: ${outputDir}`);
  
  return results;
}

// CLI
if (process.argv[1].includes('formats')) {
  const format = process.argv[2] || 'all';
  const db = new Database(DB_PATH, { readonly: true });
  
  try {
    switch (format) {
      case 'json':
        exportJSON(db, join(OUT_DIR, 'exports/json'));
        break;
      case 'csv':
        exportCSV(db, join(OUT_DIR, 'exports/csv'));
        break;
      case 'typescript':
      case 'ts':
        exportTypeScript(db, join(OUT_DIR, 'exports/typescript'));
        break;
      case 'showdown':
        exportShowdown(db, join(OUT_DIR, 'exports/showdown'));
        break;
      case 'sql':
        db.close();
        exportSQLDump(DB_PATH, join(OUT_DIR, 'exports/sql'));
        break;
      case 'all':
      default:
        db.close();
        exportAll();
        break;
    }
  } finally {
    if (format !== 'all' && format !== 'sql') {
      db.close();
    }
  }
}

export default {
  exportJSON,
  exportCSV,
  exportTypeScript,
  exportShowdown,
  exportSQLDump,
  exportAll,
  SCHEMA_VERSION
};
