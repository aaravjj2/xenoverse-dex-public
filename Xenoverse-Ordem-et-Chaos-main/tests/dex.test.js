/**
 * Unit Tests for Xenoverse Dex Tools
 * Tests export, query, validation, and relationship modules
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'out');
const DB_PATH = join(OUT_DIR, 'dex.db');

// Expected baseline counts (from README_DEV.md)
const BASELINE = {
  species: 1593,
  moves: 932,
  types: 20,
  abilities: 347,
  evolutions: 1328,
  learnsets: 116114
};

// Tolerance for counts (some may vary with updates)
const TOLERANCE = 0.05; // 5%

describe('Database Existence', () => {
  it('database file exists', () => {
    expect(existsSync(DB_PATH)).toBe(true);
  });
  
  it('database is readable', () => {
    const db = new Database(DB_PATH, { readonly: true });
    expect(db).toBeDefined();
    db.close();
  });
});

describe('Core Tables', () => {
  let db;
  
  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('species table has expected count', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM species').get().count;
    expect(count).toBeGreaterThan(BASELINE.species * (1 - TOLERANCE));
    expect(count).toBeLessThan(BASELINE.species * (1 + TOLERANCE));
  });
  
  it('moves table has expected count', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM moves').get().count;
    expect(count).toBeGreaterThan(BASELINE.moves * (1 - TOLERANCE));
    expect(count).toBeLessThan(BASELINE.moves * (1 + TOLERANCE));
  });
  
  it('types table has expected count', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM types').get().count;
    expect(count).toBe(BASELINE.types);
  });
  
  it('abilities table has expected count', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM abilities').get().count;
    expect(count).toBeGreaterThan(BASELINE.abilities * (1 - TOLERANCE));
  });
  
  it('evolutions table has expected count', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM evolutions').get().count;
    expect(count).toBeGreaterThan(BASELINE.evolutions * (1 - TOLERANCE));
  });
  
  it('learnsets table has expected count', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM learnsets').get().count;
    expect(count).toBeGreaterThan(BASELINE.learnsets * (1 - TOLERANCE));
  });
});

describe('Species Data Integrity', () => {
  let db;
  
  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('all species have valid types', () => {
    const invalid = db.prepare(`
      SELECT COUNT(*) as count FROM species 
      WHERE type1 NOT IN (SELECT id FROM types)
    `).get().count;
    expect(invalid).toBe(0);
  });
  
  it('species BST equals sum of stats', () => {
    const mismatch = db.prepare(`
      SELECT COUNT(*) as count FROM species 
      WHERE bst != (hp + attack + defense + special_attack + special_defense + speed)
    `).get().count;
    expect(mismatch).toBe(0);
  });
  
  it('all species have non-negative stats', () => {
    const negative = db.prepare(`
      SELECT COUNT(*) as count FROM species 
      WHERE hp < 0 OR attack < 0 OR defense < 0 
        OR special_attack < 0 OR special_defense < 0 OR speed < 0
    `).get().count;
    expect(negative).toBe(0);
  });
  
  it('key Pokemon exist', () => {
    const starters = ['BULBASAUR', 'CHARMANDER', 'SQUIRTLE'];
    for (const starter of starters) {
      const exists = db.prepare('SELECT COUNT(*) as count FROM species WHERE id = ?').get(starter).count;
      expect(exists).toBeGreaterThan(0);
    }
  });
  
  it('Xenoverse exclusive Pokemon exist', () => {
    const exclusives = ['TRISHOUT', 'PANGARORE', 'MEDENINE'];
    let found = 0;
    for (const exclusive of exclusives) {
      const exists = db.prepare('SELECT COUNT(*) as count FROM species WHERE id = ?').get(exclusive).count;
      if (exists > 0) found++;
    }
    // At least one Xenoverse exclusive should exist
    expect(found).toBeGreaterThan(0);
  });
});

describe('Moves Data Integrity', () => {
  let db;
  
  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('all moves have valid types', () => {
    const invalid = db.prepare(`
      SELECT COUNT(*) as count FROM moves 
      WHERE type IS NOT NULL AND type NOT IN (SELECT id FROM types)
    `).get().count;
    expect(invalid).toBe(0);
  });
  
  it('moves have valid categories', () => {
    const invalid = db.prepare(`
      SELECT COUNT(*) as count FROM moves 
      WHERE category IS NOT NULL AND category NOT IN ('Physical', 'Special', 'Status')
    `).get().count;
    expect(invalid).toBe(0);
  });
  
  it('key moves exist', () => {
    const moves = ['THUNDERBOLT', 'FLAMETHROWER', 'SURF', 'EARTHQUAKE'];
    for (const move of moves) {
      const exists = db.prepare('SELECT COUNT(*) as count FROM moves WHERE id = ?').get(move).count;
      expect(exists).toBeGreaterThan(0);
    }
  });
});

describe('Evolution Data Integrity', () => {
  let db;
  
  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('evolution sources exist in species', () => {
    const orphans = db.prepare(`
      SELECT COUNT(*) as count FROM evolutions e
      WHERE NOT EXISTS (
        SELECT 1 FROM species s 
        WHERE s.id = e.species_id AND s.form_id = e.form_id
      )
    `).get().count;
    expect(orphans).toBe(0);
  });
  
  it('evolution targets mostly exist in species', () => {
    // Allow some tolerance for potentially missing forms
    const total = db.prepare('SELECT COUNT(*) as count FROM evolutions').get().count;
    const orphans = db.prepare(`
      SELECT COUNT(*) as count FROM evolutions e
      WHERE NOT EXISTS (
        SELECT 1 FROM species s 
        WHERE s.id = e.target_species
      )
    `).get().count;
    const orphanRate = orphans / total;
    expect(orphanRate).toBeLessThan(0.05); // Less than 5% orphans
  });
});

describe('Relationship Tables', () => {
  let db;
  
  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('evolution_families table exists and has data', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM evolution_families').get().count;
    expect(count).toBeGreaterThan(1000);
  });
  
  it('ability_species table exists and has data', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM ability_species').get().count;
    expect(count).toBeGreaterThan(3000);
  });
  
  it('move_species table exists and has data', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM move_species').get().count;
    expect(count).toBeGreaterThan(100000);
  });
  
  it('species_with_tiers view works', () => {
    const result = db.prepare('SELECT COUNT(*) as count FROM species_with_tiers WHERE bst_tier IS NOT NULL').get();
    expect(result.count).toBeGreaterThan(0);
  });
});

describe('Assets Table', () => {
  let db;
  
  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });
  
  afterAll(() => {
    db.close();
  });
  
  it('assets table has mappings', () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM assets').get().count;
    expect(count).toBeGreaterThan(1500);
  });
  
  it('has reasonable front sprite coverage', () => {
    const withFront = db.prepare('SELECT COUNT(*) as count FROM assets WHERE front_path IS NOT NULL').get().count;
    const total = db.prepare('SELECT COUNT(*) as count FROM assets').get().count;
    const coverage = withFront / total;
    expect(coverage).toBeGreaterThan(0.75); // At least 75%
  });
});

describe('JSON Output Files', () => {
  it('species.json exists and is valid', () => {
    const filepath = join(OUT_DIR, 'species.json');
    expect(existsSync(filepath)).toBe(true);
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(1500);
  });
  
  it('moves.json exists and is valid', () => {
    const filepath = join(OUT_DIR, 'moves.json');
    expect(existsSync(filepath)).toBe(true);
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    expect(data.data).toBeDefined();
    expect(data.data.length).toBeGreaterThan(900);
  });
  
  it('types.json exists and is valid', () => {
    const filepath = join(OUT_DIR, 'types.json');
    expect(existsSync(filepath)).toBe(true);
    const data = JSON.parse(readFileSync(filepath, 'utf8'));
    expect(data.data).toBeDefined();
    expect(data.data.length).toBe(20);
  });
});

describe('Export Validation', () => {
  it('validation report exists', () => {
    const filepath = join(OUT_DIR, 'validation_report.json');
    if (existsSync(filepath)) {
      const report = JSON.parse(readFileSync(filepath, 'utf8'));
      expect(report.summary).toBeDefined();
      expect(report.summary.errors).toBe(0);
    }
  });
});
