/**
 * Relationship Indices for Xenoverse Dex
 * Creates additional indices and pre-computed relationship tables
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
 * Create additional relationship indices
 */
export function createRelationshipIndices(db) {
  console.log('Creating relationship indices...');
  
  db.exec(`
    -- Evolution chain indices
    CREATE INDEX IF NOT EXISTS idx_evolutions_target ON evolutions(target_species, target_form);
    CREATE INDEX IF NOT EXISTS idx_evolutions_method ON evolutions(method);
    
    -- Cross-reference indices
    CREATE INDEX IF NOT EXISTS idx_learnsets_method ON learnsets(learn_method);
    CREATE INDEX IF NOT EXISTS idx_learnsets_level ON learnsets(level);
    
    -- Search optimization indices
    CREATE INDEX IF NOT EXISTS idx_species_dex ON species(dex_number);
    CREATE INDEX IF NOT EXISTS idx_species_ability1 ON species(ability1);
    CREATE INDEX IF NOT EXISTS idx_species_ability2 ON species(ability2);
    CREATE INDEX IF NOT EXISTS idx_species_hidden_ability ON species(hidden_ability);
    CREATE INDEX IF NOT EXISTS idx_species_egg_group1 ON species(egg_group1);
    CREATE INDEX IF NOT EXISTS idx_species_egg_group2 ON species(egg_group2);
    
    -- Move search indices
    CREATE INDEX IF NOT EXISTS idx_moves_power ON moves(power);
    CREATE INDEX IF NOT EXISTS idx_moves_pp ON moves(pp);
    CREATE INDEX IF NOT EXISTS idx_moves_priority ON moves(priority);
  `);
  
  console.log('  Indices created');
}

/**
 * Create pre-computed relationship tables
 */
export function createRelationshipTables(db) {
  console.log('Creating relationship tables...');
  
  // Evolution families - connects all Pokemon in the same evolution line
  db.exec(`
    DROP TABLE IF EXISTS evolution_families;
    CREATE TABLE evolution_families (
      family_id TEXT NOT NULL,
      species_id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      stage INTEGER NOT NULL,
      position_in_stage INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (species_id, form_id)
    );
    CREATE INDEX IF NOT EXISTS idx_evo_family_id ON evolution_families(family_id);
    CREATE INDEX IF NOT EXISTS idx_evo_family_stage ON evolution_families(stage);
  `);
  
  // Type coverage - pre-computed type matchups
  db.exec(`
    DROP TABLE IF EXISTS type_matchups;
    CREATE TABLE type_matchups (
      attacking_type TEXT NOT NULL,
      defending_type TEXT NOT NULL,
      multiplier REAL NOT NULL DEFAULT 1.0,
      PRIMARY KEY (attacking_type, defending_type)
    );
  `);
  
  // Ability to species mapping for fast reverse lookups
  db.exec(`
    DROP TABLE IF EXISTS ability_species;
    CREATE TABLE ability_species (
      ability_id TEXT NOT NULL,
      species_id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      is_hidden INTEGER NOT NULL DEFAULT 0,
      slot INTEGER NOT NULL,
      PRIMARY KEY (ability_id, species_id, form_id, slot)
    );
    CREATE INDEX IF NOT EXISTS idx_ability_species_ability ON ability_species(ability_id);
  `);
  
  // Move to species mapping for fast reverse lookups
  db.exec(`
    DROP TABLE IF EXISTS move_species;
    CREATE TABLE move_species (
      move_id TEXT NOT NULL,
      species_id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      learn_method TEXT NOT NULL,
      PRIMARY KEY (move_id, species_id, form_id, learn_method)
    );
    CREATE INDEX IF NOT EXISTS idx_move_species_move ON move_species(move_id);
  `);
  
  console.log('  Relationship tables created');
}

/**
 * Populate evolution families
 */
export function populateEvolutionFamilies(db) {
  console.log('Populating evolution families...');
  
  // Get all species
  const allSpecies = db.prepare('SELECT id, form_id FROM species').all();
  
  // Get all evolution links
  const evoLinks = db.prepare('SELECT species_id, form_id, target_species, target_form FROM evolutions').all();
  
  // Build adjacency lists
  const evolvedFrom = new Map(); // child -> parent
  const evolvesTo = new Map();   // parent -> children[]
  
  for (const link of evoLinks) {
    const childKey = `${link.target_species}_${link.target_form}`;
    const parentKey = `${link.species_id}_${link.form_id}`;
    
    evolvedFrom.set(childKey, parentKey);
    
    if (!evolvesTo.has(parentKey)) {
      evolvesTo.set(parentKey, []);
    }
    evolvesTo.get(parentKey).push(childKey);
  }
  
  // Find base forms (Pokemon that don't evolve from anything)
  const baseForms = [];
  for (const sp of allSpecies) {
    const key = `${sp.id}_${sp.form_id}`;
    if (!evolvedFrom.has(key)) {
      baseForms.push(key);
    }
  }
  
  // Build families starting from base forms
  const insert = db.prepare(`
    INSERT OR REPLACE INTO evolution_families (family_id, species_id, form_id, stage, position_in_stage)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  let familiesCreated = 0;
  let membersAdded = 0;
  
  const addToFamily = db.transaction((familyId, members) => {
    for (const member of members) {
      const [speciesId, formId] = member.key.split('_');
      insert.run(familyId, speciesId, parseInt(formId) || 0, member.stage, member.position);
      membersAdded++;
    }
    familiesCreated++;
  });
  
  for (const base of baseForms) {
    // BFS to find all members of this family
    const members = [];
    const queue = [{ key: base, stage: 1 }];
    const visited = new Set();
    const stagePositions = new Map();
    
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current.key)) continue;
      visited.add(current.key);
      
      // Track position within stage
      const stagePos = stagePositions.get(current.stage) || 0;
      stagePositions.set(current.stage, stagePos + 1);
      
      members.push({ key: current.key, stage: current.stage, position: stagePos });
      
      // Add children
      const children = evolvesTo.get(current.key) || [];
      for (const child of children) {
        if (!visited.has(child)) {
          queue.push({ key: child, stage: current.stage + 1 });
        }
      }
    }
    
    if (members.length > 0) {
      addToFamily(base, members);
    }
  }
  
  console.log(`  Created ${familiesCreated} families with ${membersAdded} total members`);
}

/**
 * Populate ability-species mapping
 */
export function populateAbilitySpecies(db) {
  console.log('Populating ability-species mapping...');
  
  const allSpecies = db.prepare(`
    SELECT id, form_id, ability1, ability2, hidden_ability 
    FROM species
  `).all();
  
  const insert = db.prepare(`
    INSERT OR REPLACE INTO ability_species (ability_id, species_id, form_id, is_hidden, slot)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row.ability_id, row.species_id, row.form_id, row.is_hidden, row.slot);
      count++;
    }
  });
  
  const rows = [];
  for (const sp of allSpecies) {
    if (sp.ability1) {
      rows.push({ ability_id: sp.ability1, species_id: sp.id, form_id: sp.form_id, is_hidden: 0, slot: 1 });
    }
    if (sp.ability2) {
      rows.push({ ability_id: sp.ability2, species_id: sp.id, form_id: sp.form_id, is_hidden: 0, slot: 2 });
    }
    if (sp.hidden_ability) {
      rows.push({ ability_id: sp.hidden_ability, species_id: sp.id, form_id: sp.form_id, is_hidden: 1, slot: 3 });
    }
  }
  
  insertMany(rows);
  console.log(`  Added ${count} ability-species mappings`);
}

/**
 * Populate move-species mapping (aggregated from learnsets)
 */
export function populateMoveSpecies(db) {
  console.log('Populating move-species mapping...');
  
  const result = db.exec(`
    INSERT OR REPLACE INTO move_species (move_id, species_id, form_id, learn_method)
    SELECT DISTINCT move_id, species_id, form_id, learn_method
    FROM learnsets
  `);
  
  const count = db.prepare('SELECT COUNT(*) as count FROM move_species').get().count;
  console.log(`  Added ${count} move-species mappings`);
}

/**
 * Add stat tiers for quick filtering
 */
export function createStatTiers(db) {
  console.log('Creating stat tier views...');
  
  db.exec(`
    DROP VIEW IF EXISTS species_with_tiers;
    CREATE VIEW species_with_tiers AS
    SELECT 
      *,
      CASE 
        WHEN bst >= 600 THEN 'pseudo-legendary'
        WHEN bst >= 500 THEN 'high'
        WHEN bst >= 400 THEN 'medium'
        WHEN bst >= 300 THEN 'low'
        ELSE 'very-low'
      END as bst_tier,
      CASE
        WHEN speed >= 130 THEN 'ultra-fast'
        WHEN speed >= 100 THEN 'fast'
        WHEN speed >= 70 THEN 'medium'
        WHEN speed >= 40 THEN 'slow'
        ELSE 'ultra-slow'
      END as speed_tier
    FROM species;
  `);
  
  console.log('  Created species_with_tiers view');
}

/**
 * Run all relationship index operations
 */
export function buildRelationships(dbPath = DB_PATH) {
  const startTime = Date.now();
  console.log('Building relationship indices and tables...');
  console.log(`Database: ${dbPath}`);
  
  const db = new Database(dbPath);
  
  try {
    createRelationshipIndices(db);
    createRelationshipTables(db);
    populateEvolutionFamilies(db);
    populateAbilitySpecies(db);
    populateMoveSpecies(db);
    createStatTiers(db);
    
    // Verify
    const stats = {
      families: db.prepare('SELECT COUNT(DISTINCT family_id) as count FROM evolution_families').get().count,
      abilityMappings: db.prepare('SELECT COUNT(*) as count FROM ability_species').get().count,
      moveMappings: db.prepare('SELECT COUNT(*) as count FROM move_species').get().count
    };
    
    const duration = Date.now() - startTime;
    console.log(`\nRelationship build completed in ${duration}ms`);
    console.log(`  Evolution families: ${stats.families}`);
    console.log(`  Ability mappings: ${stats.abilityMappings}`);
    console.log(`  Move mappings: ${stats.moveMappings}`);
    
    return stats;
  } finally {
    db.close();
  }
}

// CLI execution
if (process.argv[1].includes('relationships')) {
  const dbPath = process.argv[2] || DB_PATH;
  buildRelationships(dbPath);
}

export default {
  createRelationshipIndices,
  createRelationshipTables,
  populateEvolutionFamilies,
  populateAbilitySpecies,
  populateMoveSpecies,
  createStatTiers,
  buildRelationships
};
