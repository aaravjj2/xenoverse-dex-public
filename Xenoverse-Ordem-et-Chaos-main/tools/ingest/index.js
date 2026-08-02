/**
 * Database Ingest for Xenoverse Dex
 * Loads exported JSON data into SQLite database
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const OUT_DIR = join(REPO_ROOT, 'out');
const DB_PATH = join(OUT_DIR, 'dex.db');

/**
 * Create database schema
 */
function createSchema(db) {
  console.log('Creating database schema...');

  db.exec(`
    -- Types table
    CREATE TABLE IF NOT EXISTS types (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      is_pseudo_type INTEGER DEFAULT 0,
      is_special_type INTEGER DEFAULT 0,
      weaknesses TEXT,
      resistances TEXT,
      immunities TEXT,
      icon_position INTEGER
    );
    
    -- Abilities table
    CREATE TABLE IF NOT EXISTS abilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      flags TEXT
    );
    
    -- Species table
    CREATE TABLE IF NOT EXISTS species (
      id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      name TEXT NOT NULL,
      form_name TEXT,
      type1 TEXT,
      type2 TEXT,
      hp INTEGER,
      attack INTEGER,
      defense INTEGER,
      special_attack INTEGER,
      special_defense INTEGER,
      speed INTEGER,
      bst INTEGER,
      ability1 TEXT,
      ability2 TEXT,
      hidden_ability TEXT,
      egg_group1 TEXT,
      egg_group2 TEXT,
      growth_rate TEXT,
      gender_ratio TEXT,
      catch_rate INTEGER,
      base_exp INTEGER,
      height INTEGER,
      weight INTEGER,
      color TEXT,
      shape TEXT,
      habitat TEXT,
      category TEXT,
      pokedex_entry TEXT,
      flags TEXT,
      dex_number INTEGER,
      has_evolutions INTEGER DEFAULT 0,
      has_learnset INTEGER DEFAULT 0,
      is_dev INTEGER DEFAULT 0,
      PRIMARY KEY (id, form_id),
      FOREIGN KEY (type1) REFERENCES types(id),
      FOREIGN KEY (type2) REFERENCES types(id)
    );
    
    -- Moves table
    CREATE TABLE IF NOT EXISTS moves (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      category TEXT,
      power INTEGER,
      is_variable_power INTEGER DEFAULT 0,
      accuracy INTEGER,
      pp INTEGER,
      priority INTEGER DEFAULT 0,
      target TEXT,
      function_code TEXT,
      effect_chance INTEGER,
      description TEXT,
      flags TEXT,
      FOREIGN KEY (type) REFERENCES types(id)
    );
    
    -- Evolutions table
    CREATE TABLE IF NOT EXISTS evolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      target_species TEXT NOT NULL,
      target_form INTEGER DEFAULT 0,
      method TEXT,
      param TEXT,
      raw_data TEXT,
      FOREIGN KEY (species_id, form_id) REFERENCES species(id, form_id)
    );
    
    -- Learnsets table (level-up moves)
    CREATE TABLE IF NOT EXISTS learnsets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      move_id TEXT NOT NULL,
      learn_method TEXT NOT NULL,
      level INTEGER
    );
    
    -- Assets table
    CREATE TABLE IF NOT EXISTS assets (
      species_id TEXT NOT NULL,
      form_id INTEGER NOT NULL DEFAULT 0,
      icon_path TEXT,
      front_path TEXT,
      front_shiny_path TEXT,
      back_path TEXT,
      back_shiny_path TEXT,
      egg_path TEXT,
      cry_path TEXT,
      dex_number INTEGER,
      PRIMARY KEY (species_id, form_id),
      FOREIGN KEY (species_id, form_id) REFERENCES species(id, form_id)
    );
    
    -- Export metadata
    CREATE TABLE IF NOT EXISTS export_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    -- Encounters table
    CREATE TABLE IF NOT EXISTS encounters (
      id TEXT PRIMARY KEY,
      map_id INTEGER NOT NULL,
      map_name TEXT,
      version INTEGER DEFAULT 0
    );

    -- Encounter Slots table
    CREATE TABLE IF NOT EXISTS encounter_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      encounter_id TEXT NOT NULL,
      type TEXT NOT NULL,
      species_id TEXT NOT NULL,
      internal_name TEXT,
      min_level INTEGER,
      max_level INTEGER,
      chance INTEGER,
      FOREIGN KEY (encounter_id) REFERENCES encounters(id)
    );
    
    -- Items table (Canonical Layer A)
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_plural TEXT,
      pocket INTEGER DEFAULT 0,
      price INTEGER DEFAULT 0,
      sell_price INTEGER DEFAULT 0,
      bp_price INTEGER DEFAULT 0,
      field_use INTEGER DEFAULT 0,
      battle_use INTEGER DEFAULT 0,
      flags TEXT,
      consumable INTEGER DEFAULT 1,
      show_quantity INTEGER,
      move TEXT,
      description TEXT
    );
    
    -- Trainers table (Canonical Layer A)
    CREATE TABLE IF NOT EXISTS trainers (
      id TEXT PRIMARY KEY,
      trainer_type TEXT,
      name TEXT NOT NULL,
      version INTEGER DEFAULT 0,
      items TEXT,
      lose_text TEXT,
      party_count INTEGER DEFAULT 0
    );
    
    -- Trainer Party table
    CREATE TABLE IF NOT EXISTS trainer_party (
      trainer_id TEXT NOT NULL,
      slot INTEGER NOT NULL,
      species_id TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      moves TEXT,
      ability_index INTEGER DEFAULT 0,
      item TEXT,
      nature TEXT,
      gender TEXT,
      form INTEGER DEFAULT 0,
      ivs TEXT,
      evs TEXT,
      PRIMARY KEY (trainer_id, slot),
      FOREIGN KEY (trainer_id) REFERENCES trainers(id)
    );
    
    -- World Facts table (Layer B: Derived)
    CREATE TABLE IF NOT EXISTS world_facts (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      map_id INTEGER,
      map_name TEXT,
      event_id INTEGER,
      page_index INTEGER NOT NULL DEFAULT -1,
      command_index INTEGER NOT NULL DEFAULT -1,
      payload TEXT,
      confidence TEXT DEFAULT 'high',
      reason TEXT,
      raw_snippet TEXT,
      conditions TEXT
    );
     
    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_species_name ON species(name);
    CREATE INDEX IF NOT EXISTS idx_species_bst ON species(bst);
    CREATE INDEX IF NOT EXISTS idx_species_type1 ON species(type1);
    CREATE INDEX IF NOT EXISTS idx_species_type2 ON species(type2);
    CREATE INDEX IF NOT EXISTS idx_moves_type ON moves(type);
    CREATE INDEX IF NOT EXISTS idx_moves_category ON moves(category);
    CREATE INDEX IF NOT EXISTS idx_learnsets_species ON learnsets(species_id, form_id);
    CREATE INDEX IF NOT EXISTS idx_learnsets_move ON learnsets(move_id);
    CREATE INDEX IF NOT EXISTS idx_evolutions_species ON evolutions(species_id, form_id);
    CREATE INDEX IF NOT EXISTS idx_encounter_slots_species ON encounter_slots(species_id);
    CREATE INDEX IF NOT EXISTS idx_encounter_slots_encounter ON encounter_slots(encounter_id);
    CREATE INDEX IF NOT EXISTS idx_items_pocket ON items(pocket);
    CREATE INDEX IF NOT EXISTS idx_trainers_type ON trainers(trainer_type);
    CREATE INDEX IF NOT EXISTS idx_trainer_party_species ON trainer_party(species_id);
    CREATE INDEX IF NOT EXISTS idx_world_facts_type ON world_facts(type);
    CREATE INDEX IF NOT EXISTS idx_world_facts_map ON world_facts(map_id);
  `);

  console.log('  Schema created');
}

/**
 * Clear all data (for idempotent ingestion)
 */
function clearData(db) {
  console.log('Clearing existing data...');

  db.exec(`
    DELETE FROM world_facts;
    DELETE FROM trainer_party;
    DELETE FROM trainers;
    DELETE FROM items;
    DELETE FROM encounter_slots;
    DELETE FROM encounters;
    DELETE FROM learnsets;
    DELETE FROM evolutions;
    DELETE FROM assets;
    DELETE FROM species;
    DELETE FROM moves;
    DELETE FROM abilities;
    DELETE FROM types;
    DELETE FROM export_meta;
  `);

  console.log('  Data cleared');
}

/**
 * Load types
 */
function loadTypes(db) {
  const filePath = join(OUT_DIR, 'types.json');
  if (!existsSync(filePath)) {
    console.log('  types.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insert = db.prepare(`
    INSERT OR REPLACE INTO types (id, name, is_pseudo_type, is_special_type, weaknesses, resistances, immunities, icon_position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((types) => {
    for (const type of types) {
      insert.run(
        type.id,
        type.name,
        type.isPseudoType ? 1 : 0,
        type.isSpecialType ? 1 : 0,
        JSON.stringify(type.weaknesses || []),
        JSON.stringify(type.resistances || []),
        JSON.stringify(type.immunities || []),
        type.iconPosition
      );
    }
  });

  insertMany(data.data);
  return data.data.length;
}

/**
 * Load abilities
 */
function loadAbilities(db) {
  const filePath = join(OUT_DIR, 'abilities.json');
  if (!existsSync(filePath)) {
    console.log('  abilities.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insert = db.prepare(`
    INSERT OR REPLACE INTO abilities (id, name, description, flags)
    VALUES (?, ?, ?, ?)
  `);

  const insertMany = db.transaction((abilities) => {
    for (const ability of abilities) {
      insert.run(
        ability.id,
        ability.name,
        ability.description,
        JSON.stringify(ability.flags || [])
      );
    }
  });

  insertMany(data.data);
  return data.data.length;
}

/**
 * Load moves
 */
function loadMoves(db) {
  const filePath = join(OUT_DIR, 'moves.json');
  if (!existsSync(filePath)) {
    console.log('  moves.json not found, skipping');
    return { count: 0, movesSet: new Set() };
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insert = db.prepare(`
    INSERT OR REPLACE INTO moves (id, name, type, category, power, is_variable_power, accuracy, pp, priority, target, function_code, effect_chance, description, flags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const movesSet = new Set();

  const insertMany = db.transaction((moves) => {
    for (const move of moves) {
      const moveId = move.id || move.internalName;
      movesSet.add(moveId);
      insert.run(
        moveId,
        move.name,
        move.type,
        move.category,
        move.power,
        move.isVariablePower ? 1 : 0,
        move.accuracy,
        move.pp,
        move.priority || 0,
        move.target,
        move.functionCode,
        move.effectChance,
        move.description,
        JSON.stringify(move.flags || [])
      );
    }
  });

  insertMany(data.data);
  return { count: data.data.length, movesSet };
}

/**
 * Check if a species entry is a dev/placeholder entry
 */
function isDevEntry(s) {
  // The game ships real species (X-forms, customs like CHIMAOOZE/DRAGALISK) whose
  // compiled species.dat has placeholder real_name="WIP" and all-1 stats, yet they
  // have full sprite/cry/encounter content in-game. The export pipeline now resolves
  // their display names from the species key, so only flag entries whose *resolved*
  // name still looks like a placeholder.
  const placeholderPatterns = ['WIP', 'TEST', 'PLACEHOLDER', 'TODO', 'TEMP', '???'];
  const name = (s.name || '').toUpperCase();
  for (const pattern of placeholderPatterns) {
    if (name === pattern || name.includes(pattern)) {
      return true;
    }
  }

  // Check for missing required display name
  if (!s.name || s.name.trim() === '') {
    return true;
  }

  return false;
}

/**
 * Load species
 */
function loadSpecies(db, assetsManifest) {
  const filePath = join(OUT_DIR, 'species.json');
  if (!existsSync(filePath)) {
    console.log('  species.json not found, skipping');
    return { count: 0, devCount: 0 };
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  // Build assets lookup
  const assetsLookup = new Map();
  if (assetsManifest) {
    for (const asset of assetsManifest.assets) {
      assetsLookup.set(`${asset.speciesId}_${asset.formId}`, asset);
    }
  }

  const insertSpecies = db.prepare(`
    INSERT OR REPLACE INTO species (
      id, form_id, name, form_name, type1, type2,
      hp, attack, defense, special_attack, special_defense, speed, bst,
      ability1, ability2, hidden_ability,
      egg_group1, egg_group2, growth_rate, gender_ratio,
      catch_rate, base_exp, height, weight, color, shape, habitat,
      category, pokedex_entry, flags, dex_number, has_evolutions, has_learnset, is_dev
    ) VALUES ($id, $form_id, $name, $form_name, $type1, $type2,
      $hp, $attack, $defense, $special_attack, $special_defense, $speed, $bst,
      $ability1, $ability2, $hidden_ability,
      $egg_group1, $egg_group2, $growth_rate, $gender_ratio,
      $catch_rate, $base_exp, $height, $weight, $color, $shape, $habitat,
      $category, $pokedex_entry, $flags, $dex_number, $has_evolutions, $has_learnset, $is_dev)
  `);

  const insertEvolution = db.prepare(`
    INSERT INTO evolutions (species_id, form_id, target_species, target_form, method, param, raw_data)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAsset = db.prepare(`
    INSERT OR REPLACE INTO assets (species_id, form_id, icon_path, front_path, front_shiny_path, back_path, back_shiny_path, egg_path, cry_path, dex_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((species) => {
    let devCount = 0;
    for (const s of species) {
      const assetKey = `${s.id}_${s.formId}`;
      const asset = assetsLookup.get(assetKey);
      const isDev = isDevEntry(s) ? 1 : 0;
      if (isDev) devCount++;

      // Helper to convert undefined to null
      const n = (v) => (v === undefined ? null : v);

      insertSpecies.run({
        id: n(s.id),
        form_id: n(s.formId) ?? 0,
        name: n(s.name),
        form_name: n(s.formName),
        type1: s.types?.[0] ?? null,
        type2: s.types?.[1] ?? null,
        hp: n(s.stats?.hp),
        attack: n(s.stats?.attack),
        defense: n(s.stats?.defense),
        special_attack: n(s.stats?.special_attack),
        special_defense: n(s.stats?.special_defense),
        speed: n(s.stats?.speed),
        bst: n(s.bst),
        ability1: s.abilities?.normal?.[0] ?? null,
        ability2: s.abilities?.normal?.[1] ?? null,
        hidden_ability: s.abilities?.hidden?.[0] ?? null,
        egg_group1: s.eggGroups?.[0] ?? null,
        egg_group2: s.eggGroups?.[1] ?? null,
        growth_rate: n(s.growthRate),
        gender_ratio: n(s.genderRatio),
        catch_rate: n(s.catchRate),
        base_exp: n(s.baseExp),
        height: n(s.height),
        weight: n(s.weight),
        color: n(s.color),
        shape: n(s.shape),
        habitat: n(s.habitat),
        category: n(s.category),
        pokedex_entry: n(s.pokedexEntry),
        flags: JSON.stringify(s.flags || []),
        dex_number: asset?.dexNumber ?? null,
        has_evolutions: s.evolutions?.length > 0 ? 1 : 0,
        has_learnset: 0,
        is_dev: isDev
      });

      // Insert evolutions
      if (s.evolutions && s.evolutions.length > 0) {
        for (const evo of s.evolutions) {
          // Convert param to string, handle various types
          let paramStr = null;
          if (evo.param !== null && evo.param !== undefined) {
            if (typeof evo.param === 'boolean') {
              paramStr = evo.param ? 'true' : 'false';
            } else {
              paramStr = String(evo.param);
            }
          }

          // Handle targetForm - could be boolean, number, or undefined
          let targetFormInt = 0;
          if (typeof evo.targetForm === 'number') {
            targetFormInt = evo.targetForm;
          } else if (evo.targetForm === true) {
            targetFormInt = 1; // Use 1 as indicator of "use evolved form"
          }

          insertEvolution.run(
            s.id,
            s.formId,
            evo.target || '',
            targetFormInt,
            evo.method || '',
            paramStr,
            JSON.stringify(evo.raw || evo)
          );
        }
      }

      // Insert asset mapping
      if (asset) {
        insertAsset.run(
          s.id,
          s.formId,
          asset.assets?.icon,
          asset.assets?.front,
          asset.assets?.frontShiny,
          asset.assets?.back,
          asset.assets?.backShiny,
          asset.assets?.egg,
          asset.assets?.cry,
          asset.dexNumber
        );
      }
    }
    return devCount;
  });

  const devCount = insertMany(data.data);
  return { count: data.data.length, devCount };
}

/**
 * Load learnsets
 */
function loadLearnsets(db, movesSet) {
  const filePath = join(OUT_DIR, 'learnsets.json');
  if (!existsSync(filePath)) {
    console.log('  learnsets.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insert = db.prepare(`
    INSERT INTO learnsets (species_id, form_id, move_id, learn_method, level)
    VALUES (?, ?, ?, ?, ?)
  `);

  const updateSpecies = db.prepare(`
    UPDATE species SET has_learnset = 1 WHERE id = ? AND form_id = ?
  `);

  let count = 0;
  let skipped = 0;

  const insertMany = db.transaction((learnsets) => {
    for (const ls of learnsets) {
      let hasAnyMoves = false;

      // Level-up moves
      if (ls.levelUp) {
        for (const move of ls.levelUp) {
          if (move && move.move) {
            // Skip if move doesn't exist in moves table
            if (!movesSet.has(move.move)) {
              skipped++;
              continue;
            }
            insert.run(ls.species, ls.formId || 0, move.move, 'level', move.level);
            count++;
            hasAnyMoves = true;
          }
        }
      }

      // Tutor moves
      if (ls.tutor) {
        for (const move of ls.tutor) {
          if (move) {
            const moveId = typeof move === 'string' ? move : move.move || move.id;
            if (moveId && movesSet.has(moveId)) {
              insert.run(ls.species, ls.formId || 0, moveId, 'tutor', null);
              count++;
              hasAnyMoves = true;
            } else {
              skipped++;
            }
          }
        }
      }

      // Egg moves
      if (ls.egg) {
        for (const move of ls.egg) {
          if (move) {
            const moveId = typeof move === 'string' ? move : move.move || move.id;
            if (moveId && movesSet.has(moveId)) {
              insert.run(ls.species, ls.formId || 0, moveId, 'egg', null);
              count++;
              hasAnyMoves = true;
            } else {
              skipped++;
            }
          }
        }
      }

      if (hasAnyMoves) {
        updateSpecies.run(ls.species, ls.formId || 0);
      }
    }
  });

  insertMany(data.data);

  if (skipped > 0) {
    console.log(`    (skipped ${skipped} moves not in moves table)`);
  }

  return count;
}

/**
 * Load encounters
 */
function loadEncounters(db) {
  const filePath = join(OUT_DIR, 'encounters.json');
  if (!existsSync(filePath)) {
    console.log('  encounters.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insertEncounter = db.prepare(`
    INSERT INTO encounters (id, map_id, map_name, version)
    VALUES (?, ?, ?, ?)
  `);

  const insertSlot = db.prepare(`
    INSERT INTO encounter_slots (encounter_id, type, species_id, internal_name, min_level, max_level, chance)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((encounters) => {
    for (const enc of encounters) {
      insertEncounter.run(
        enc.id,
        enc.mapId,
        enc.mapName,
        enc.version
      );

      if (enc.slots) {
        for (const slot of enc.slots) {
          insertSlot.run(
            enc.id,
            slot.type,
            slot.species, // internal name is often same as species ID in dat but normalized in map
            slot.species,
            slot.minLevel,
            slot.maxLevel,
            slot.chance
          );
        }
      }
    }
  });

  insertMany(data.data);
  return data.data.length;
}

/**
 * Load items (Canonical Layer A)
 */
function loadItems(db) {
  const filePath = join(OUT_DIR, 'items.json');
  if (!existsSync(filePath)) {
    console.log('  items.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insert = db.prepare(`
    INSERT INTO items (id, name, name_plural, pocket, price, sell_price, bp_price, 
                       field_use, battle_use, flags, consumable, show_quantity, move, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run(
        item.id,
        item.name,
        item.namePlural || null,
        item.pocket || 0,
        item.price || 0,
        item.sellPrice || 0,
        item.bpPrice || 0,
        item.fieldUse || 0,
        item.battleUse || 0,
        JSON.stringify(item.flags || []),
        item.consumable ? 1 : 0,
        item.showQuantity,
        item.move || null,
        item.description || null
      );
    }
  });

  insertMany(data.data);
  return data.data.length;
}

/**
 * Load trainers (Canonical Layer A)
 */
function loadTrainers(db) {
  const filePath = join(OUT_DIR, 'trainers.json');
  if (!existsSync(filePath)) {
    console.log('  trainers.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insertTrainer = db.prepare(`
    INSERT INTO trainers (id, trainer_type, name, version, items, lose_text, party_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertParty = db.prepare(`
    INSERT INTO trainer_party (trainer_id, slot, species_id, level, moves, ability_index, item, nature, gender, form, ivs, evs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((trainers) => {
    for (const trainer of trainers) {
      insertTrainer.run(
        trainer.id,
        trainer.trainerType,
        trainer.name,
        trainer.version || 0,
        JSON.stringify(trainer.items || []),
        trainer.loseText || null,
        trainer.partyCount || 0
      );

      // Insert party members
      if (trainer.party) {
        for (const pokemon of trainer.party) {
          insertParty.run(
            trainer.id,
            pokemon.slot,
            pokemon.species,
            pokemon.level || 1,
            JSON.stringify(pokemon.moves || []),
            pokemon.abilityIndex || 0,
            pokemon.item || null,
            pokemon.nature || null,
            pokemon.gender || null,
            pokemon.form || 0,
            pokemon.ivs ? JSON.stringify(pokemon.ivs) : null,
            pokemon.evs ? JSON.stringify(pokemon.evs) : null
          );
        }
      }
    }
  });

  insertMany(data.data);
  return data.data.length;
}

/**
 * Load world facts (Layer B: Derived)
 */
function loadWorldFacts(db) {
  const filePath = join(OUT_DIR, 'world_facts.json');
  if (!existsSync(filePath)) {
    console.log('  world_facts.json not found, skipping');
    return 0;
  }

  const data = JSON.parse(readFileSync(filePath, 'utf8'));

  const insert = db.prepare(`
    INSERT INTO world_facts (id, type, map_id, map_name, event_id, page_index, command_index, 
                             payload, confidence, reason, raw_snippet, conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((facts) => {
    for (const fact of facts) {
      insert.run(
        fact.id,
        fact.type,
        fact.mapId,
        fact.mapName || null,
        fact.eventId ?? null,
        fact.pageIndex ?? null,
        fact.commandIndex ?? null,
        JSON.stringify(fact.payload || {}),
        fact.confidence || 'high',
        fact.reason || null,
        fact.rawSnippet || null,
        fact.conditions ? JSON.stringify(fact.conditions) : null
      );
    }
  });

  insertMany(data.data);
  return data.data.length;
}

/**
 * Load export metadata
 */
function loadMeta(db) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO export_meta (key, value) VALUES (?, ?)
  `);

  // Load meta from each file
  const files = ['species.json', 'moves.json', 'types.json', 'abilities.json', 'assets_manifest.json'];

  for (const file of files) {
    const filePath = join(OUT_DIR, file);
    if (existsSync(filePath)) {
      try {
        const data = JSON.parse(readFileSync(filePath, 'utf8'));
        if (data.meta) {
          insert.run(`${file.replace('.json', '')}_export_time`, data.meta.exportTime || null);
          insert.run(`${file.replace('.json', '')}_count`, data.meta.count?.toString() || '0');
        }
      } catch { }
    }
  }

  insert.run('ingest_time', new Date().toISOString());
}

/**
 * Main ingest function
 */
function ingest() {
  console.log('Starting database ingest...\n');
  const startTime = Date.now();

  // Check for required files
  const speciesPath = join(OUT_DIR, 'species.json');
  if (!existsSync(speciesPath)) {
    console.error('Error: species.json not found. Run export first.');
    process.exit(1);
  }

  // Load assets manifest
  let assetsManifest = null;
  const assetsPath = join(OUT_DIR, 'assets_manifest.json');
  if (existsSync(assetsPath)) {
    assetsManifest = JSON.parse(readFileSync(assetsPath, 'utf8'));
    console.log(`Loaded assets manifest: ${assetsManifest.assets.length} entries\n`);
  }

  // Create/open database
  console.log(`Database: ${DB_PATH}`);
  const db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  try {
    // Create schema
    createSchema(db);

    // Clear existing data (idempotent)
    clearData(db);

    // Load data
    console.log('\nLoading data...');

    const typesCount = loadTypes(db);
    console.log(`  Types: ${typesCount}`);

    const abilitiesCount = loadAbilities(db);
    console.log(`  Abilities: ${abilitiesCount}`);

    const { count: movesCount, movesSet } = loadMoves(db);
    console.log(`  Moves: ${movesCount}`);

    const { count: speciesCount, devCount } = loadSpecies(db, assetsManifest);
    console.log(`  Species: ${speciesCount} (${devCount} dev/placeholder entries)`);

    const learnsetsCount = loadLearnsets(db, movesSet);
    console.log(`  Learnset entries: ${learnsetsCount}`);

    const encountersCount = loadEncounters(db);
    console.log(`  Encounter maps: ${encountersCount}`);

    const itemsCount = loadItems(db);
    console.log(`  Items: ${itemsCount}`);

    const trainersCount = loadTrainers(db);
    console.log(`  Trainers: ${trainersCount}`);

    const worldFactsCount = loadWorldFacts(db);
    console.log(`  World facts: ${worldFactsCount}`);

    // Load metadata
    loadMeta(db);

    // Verify counts
    console.log('\nVerifying...');
    const verifySpecies = db.prepare('SELECT COUNT(*) as count FROM species').get();
    const verifyMoves = db.prepare('SELECT COUNT(*) as count FROM moves').get();
    const verifyEvolutions = db.prepare('SELECT COUNT(*) as count FROM evolutions').get();
    const verifyAssets = db.prepare('SELECT COUNT(*) as count FROM assets').get();
    const verifyItems = db.prepare('SELECT COUNT(*) as count FROM items').get();
    const verifyTrainers = db.prepare('SELECT COUNT(*) as count FROM trainers').get();
    const verifyTrainerParty = db.prepare('SELECT COUNT(*) as count FROM trainer_party').get();
    const verifyWorldFacts = db.prepare('SELECT COUNT(*) as count FROM world_facts').get();

    console.log(`  Species in DB: ${verifySpecies.count}`);
    console.log(`  Moves in DB: ${verifyMoves.count}`);
    console.log(`  Evolutions in DB: ${verifyEvolutions.count}`);
    console.log(`  Asset mappings in DB: ${verifyAssets.count}`);
    console.log(`  Items in DB: ${verifyItems.count}`);
    console.log(`  Trainers in DB: ${verifyTrainers.count}`);
    console.log(`  Trainer party members in DB: ${verifyTrainerParty.count}`);
    console.log(`  World facts in DB: ${verifyWorldFacts.count}`);

    const duration = Date.now() - startTime;
    console.log(`\nIngest completed in ${duration}ms`);

    return { success: true };

  } finally {
    db.close();
  }
}

// Run
const result = ingest();
process.exit(result.success ? 0 : 1);
