/**
 * Data Exporter for Xenoverse-Ordem-et-Chaos
 * Exports canonical data from Ruby Marshal .dat files to normalized JSON
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode, detectFormat } from './marshal.js';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const DATA_DIR = join(REPO_ROOT, 'Data');
const OUT_DIR = join(REPO_ROOT, 'out');

// Ensure output directory exists
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Get git commit hash if available
 */
function getCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Read and decode a .dat file
 */
function readDatFile(filename) {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    return { error: `File not found: ${filename}`, data: null };
  }

  const buffer = readFileSync(filepath);
  const format = detectFormat(buffer);

  try {
    const result = decode(buffer);
    return {
      filename,
      format,
      ...result
    };
  } catch (error) {
    return {
      filename,
      format,
      error: error.message,
      data: null
    };
  }
}

/**
 * Generate file signature report
 */
function generateSignatureReport() {
  const files = ['species.dat', 'moves.dat', 'types.dat', 'abilities.dat'];
  const report = [];

  for (const file of files) {
    const filepath = join(DATA_DIR, file);
    if (existsSync(filepath)) {
      const buffer = readFileSync(filepath);
      const format = detectFormat(buffer);
      report.push({
        file,
        size: buffer.length,
        ...format
      });
    } else {
      report.push({ file, error: 'not found' });
    }
  }

  return report;
}

/**
 * Normalize a species entry
 */
function normalizeSpecies(key, data, typesMap, abilitiesSet) {
  const warnings = [];

  // Extract base stats
  const stats = {
    hp: data.base_stats?.HP || data.base_stats?.hp || 0,
    attack: data.base_stats?.ATK || data.base_stats?.ATTACK || data.base_stats?.attack || 0,
    defense: data.base_stats?.DEF || data.base_stats?.DEFENSE || data.base_stats?.defense || 0,
    special_attack: data.base_stats?.SPATK || data.base_stats?.SPECIAL_ATTACK || data.base_stats?.spa || data.base_stats?.special_attack || 0,
    special_defense: data.base_stats?.SPDEF || data.base_stats?.SPECIAL_DEFENSE || data.base_stats?.spd || data.base_stats?.special_defense || 0,
    speed: data.base_stats?.SPD || data.base_stats?.SPEED || data.base_stats?.speed || data.base_stats?.spe || 0
  };

  const bst = stats.hp + stats.attack + stats.defense +
    stats.special_attack + stats.special_defense + stats.speed;

  // Extract types
  let types = [];
  if (Array.isArray(data.types)) {
    types = data.types.map(t => typeof t === 'string' ? t : t?.id || t?.name || String(t));
  } else if (data.type1 || data.type2) {
    if (data.type1) types.push(data.type1);
    if (data.type2 && data.type2 !== data.type1) types.push(data.type2);
  }

  // Validate types
  for (const type of types) {
    if (typesMap && !typesMap.has(type.toUpperCase())) {
      warnings.push(`Unknown type: ${type}`);
    }
  }

  // Extract abilities
  let abilities = [];
  if (Array.isArray(data.abilities)) {
    abilities = data.abilities.filter(a => a != null).map(a =>
      typeof a === 'string' ? a : a?.id || a?.name || String(a)
    );
  }

  // Extract hidden abilities
  let hiddenAbilities = [];
  if (Array.isArray(data.hidden_abilities)) {
    hiddenAbilities = data.hidden_abilities.filter(a => a != null).map(a =>
      typeof a === 'string' ? a : a?.id || a?.name || String(a)
    );
  } else if (data.hidden_ability) {
    hiddenAbilities = [data.hidden_ability];
  }

  // Extract evolutions
  let evolutions = [];
  if (Array.isArray(data.evolutions)) {
    evolutions = data.evolutions.map(evo => {
      if (Array.isArray(evo)) {
        // Format: [target_species, method, param, form_id?]
        return {
          target: evo[0],
          method: evo[1],
          param: evo[2],
          targetForm: evo[3] || 0,
          raw: evo
        };
      } else if (typeof evo === 'object') {
        return {
          target: evo.species || evo.target,
          method: evo.method || evo.type,
          param: evo.parameter || evo.param || evo.level || evo.item,
          targetForm: evo.form || 0,
          raw: evo
        };
      }
      return { raw: evo };
    });
  }

  // Extract form information
  const formId = data.form || data.form_id || 0;
  const formName = data.form_name || null;

  // Extract egg groups
  let eggGroups = [];
  if (Array.isArray(data.egg_groups)) {
    eggGroups = data.egg_groups.map(g => typeof g === 'string' ? g : String(g));
  }

  // Extract growth rate
  const growthRate = data.growth_rate || null;

  return {
    id: data.id,
    species: data.species || key,
    formId,
    formName,
    // The game ships real species (X-forms, customs like CHIMAOOZE/DRAGALISK) whose
    // compiled species.dat has real_name="WIP" (placeholder) — but they have full
    // sprite/cry/encounter content in-game. Use the internal species key as the
    // display name so they don't show up as "WIP".
    name: data.name ||
      (data.real_name && !/^(WIP|TEST|PLACEHOLDER|TODO|TEMP|\?\?\?)$/i.test(data.real_name.trim())
        ? data.real_name
        : null) ||
      data.species ||
      key,
    types,
    stats,
    bst,
    abilities: {
      normal: abilities,
      hidden: hiddenAbilities
    },
    evolutions,
    eggGroups,
    growthRate,
    genderRatio: data.gender_ratio || data.gender_rate,
    catchRate: data.catch_rate,
    baseExp: data.base_exp,
    height: data.height,
    weight: data.weight,
    color: data.color,
    shape: data.shape,
    habitat: data.habitat,
    category: data.category || data.kind,
    pokedexEntry: data.pokedex_entry || data.description,
    flags: data.flags || [],
    _warnings: warnings.length > 0 ? warnings : undefined,
    _source: 'species.dat'
  };
}

/**
 * Normalize a move entry
 */
function normalizeMove(key, data, typesMap) {
  const warnings = [];

  const type = data.type || data.move_type;
  if (typesMap && type && !typesMap.has(String(type).toUpperCase())) {
    warnings.push(`Unknown type: ${type}`);
  }

  // Determine category
  // Pokémon Essentials uses: 0=Physical, 1=Special, 2=Status
  let category = data.category ?? data.damage_class;
  if (typeof category === 'number') {
    category = ['Physical', 'Special', 'Status'][category] || 'Unknown';
  }

  // Determine power - detect variable-power moves
  // Moves with power=1 and specific function codes are variable-power
  const rawPower = data.power || data.base_power || 0;
  const functionCode = data.function_code || data.function || '';

  // Variable-power function codes that should display "Varies" instead of numeric power
  const variablePowerFunctions = [
    'PowerHigherWithUserHappiness',     // Return, JoyForce
    'PowerLowerWithUserHappiness',      // Frustration, AngerWave
    'PowerHigherWithTargetWeight',      // Low Kick, Grass Knot
    'PowerHigherWithUserHeavierThanTarget', // Heat Crash, Heavy Slam
    'PowerHigherWithTargetHP',          // Crush Grip, Wring Out
    'PowerHigherWithTargetHP100PowerRange', // Hard Press
    'PowerLowerWithUserHP',             // Flail, Reversal
    'PowerHigherWithUserFasterThanTarget', // Electro Ball, Mach Dive
    'PowerHigherWithTargetFasterThanUser', // Gyro Ball
    'PowerHigherWithTargetPositiveStatStages', // Punishment
    'PowerHigherWithLessPP',            // Trump Card
    'PowerDependsOnUserStockpile',      // Spit Up
    'TypeAndPowerDependOnUserBerry',    // Natural Gift
    'RandomPowerDoublePowerIfTargetUnderground', // Magnitude
    'HitOncePerUserTeamMember',         // Beat Up
    'ThrowUserItemAtTarget',            // Fling
  ];

  const isVariablePower = rawPower === 1 && variablePowerFunctions.includes(functionCode);
  // For variable-power moves, store null as power to indicate it varies
  const power = isVariablePower ? null : rawPower;

  return {
    id: data.id,
    internalName: data.id || key,
    name: data.name || data.real_name || key,
    type: type,
    category,
    power,
    isVariablePower,
    accuracy: data.accuracy,
    pp: data.pp || data.total_pp,
    priority: data.priority || 0,
    target: data.target,
    functionCode,
    flags: data.flags || [],
    effectChance: data.effect_chance,
    description: data.description || data.real_description,
    _warnings: warnings.length > 0 ? warnings : undefined,
    _source: 'moves.dat'
  };
}

/**
 * Normalize a type entry
 */
function normalizeType(key, data) {
  return {
    id: data.id || key,
    internalName: data.id || key,
    name: data.name || data.real_name || key,
    weaknesses: data.weaknesses || [],
    resistances: data.resistances || [],
    immunities: data.immunities || [],
    iconPosition: data.icon_position,
    isPseudoType: data.pseudo_type || false,
    isSpecialType: data.special_type || data.is_special_type || false,
    _source: 'types.dat'
  };
}

/**
 * Normalize an ability entry
 */
function normalizeAbility(key, data) {
  return {
    id: data.id || key,
    internalName: data.id || key,
    name: data.name || data.real_name || key,
    description: data.description || data.real_description,
    flags: data.flags || [],
    _source: 'abilities.dat'
  };
}

/**
 * Normalize an encounter entry
 */
function normalizeEncounter(key, data, mapInfos) {
  const mapId = data.map;
  const mapName = mapInfos.get(mapId) || `Map ${mapId}`;

  const slots = [];

  if (data.step_chances) {
    // Process step chances if needed (e.g. for verifying types)
  }

  if (data.types) {
    for (const [type, entries] of Object.entries(data.types)) {
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          // Entry format seems to be [chance, species, minLvl, maxLvl] based on debug output
          if (Array.isArray(entry) && entry.length >= 2) {
            slots.push({
              type: type,
              chance: entry[0],
              species: entry[1],
              minLevel: entry[2],
              maxLevel: entry[3] ?? entry[2]
            });
          }
        }
      }
    }
  }

  return {
    id: data.id || key,
    mapId: mapId,
    mapName: mapName,
    version: data.version ?? 0,
    slots: slots,
    _source: 'encounters.dat'
  };
}

/**
 * Normalize an item entry
 */
function normalizeItem(key, data) {
  return {
    id: data.id || key,
    internalName: data.id || key,
    name: data.real_name || data.name || key,
    namePlural: data.real_name_plural || null,
    pocket: data.pocket || 0,
    price: data.price || 0,
    sellPrice: data.sell_price || Math.floor((data.price || 0) / 2),
    bpPrice: data.bp_price || 0,
    fieldUse: data.field_use || 0,
    battleUse: data.battle_use || 0,
    flags: data.flags || [],
    consumable: data.consumable ?? true,
    showQuantity: data.show_quantity,
    move: data.move || null,
    description: data.real_description || data.description || '',
    _source: 'items.dat'
  };
}

/**
 * Normalize a trainer entry
 */
function normalizeTrainer(key, data) {
  // Parse trainer ID which is [trainer_type, name, version]
  const idParts = Array.isArray(data.id) ? data.id : [key];
  const trainerType = data.trainer_type || idParts[0] || 'UNKNOWN';
  const trainerName = data.real_name || idParts[1] || 'Unknown';
  const version = data.version ?? idParts[2] ?? 0;

  // Normalize pokemon party
  const party = [];
  if (Array.isArray(data.pokemon)) {
    for (let i = 0; i < data.pokemon.length; i++) {
      const pkmn = data.pokemon[i];
      party.push({
        slot: i,
        species: pkmn.species || 'UNKNOWN',
        level: pkmn.level || 1,
        moves: pkmn.moves || [],
        abilityIndex: pkmn.ability_index ?? 0,
        item: pkmn.item || null,
        nature: pkmn.nature || null,
        gender: pkmn.gender || null,
        form: pkmn.form || 0,
        ivs: pkmn.iv || null,
        evs: pkmn.ev || null
      });
    }
  }

  return {
    id: `${trainerType},${trainerName},${version}`,
    trainerType,
    name: trainerName,
    version,
    items: data.items || [],
    loseText: data.real_lose_text || null,
    party,
    partyCount: party.length,
    _source: 'trainers.dat'
  };
}

/**
 * Export all canonical data
 */
function exportAll() {
  console.log('Starting canonical data export...\n');

  const startTime = Date.now();
  const commitHash = getCommitHash();
  const signatureReport = generateSignatureReport();

  console.log('File signatures:');
  for (const sig of signatureReport) {
    console.log(`  ${sig.file}: ${sig.format || sig.error} (${sig.size || 0} bytes)`);
  }
  console.log('');

  const results = {
    species: null,
    moves: null,
    types: null,
    abilities: null,
    evolutions: null,
    learnsets: null,
    encounters: null,
    items: null,
    trainers: null
  };

  const allWarnings = [];

  // 0. Load MapInfos to resolve map names
  console.log('Loading MapInfos...');
  const mapInfosResult = readDatFile('MapInfos.rxdata');
  const mapInfos = new Map();
  if (mapInfosResult.data) {
    const data = mapInfosResult.data;
    if (typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        if (value && value.name) {
          mapInfos.set(Number(key), value.name);
        }
      }
    }
    console.log(`  Loaded ${mapInfos.size} map names`);
  } else {
    console.log('  Warning: Could not load MapInfos.rxdata');
    allWarnings.push(`MapInfos.rxdata: ${mapInfosResult.error}`);
  }

  // 1. Export types first (for validation)
  console.log('Exporting types...');
  const typesResult = readDatFile('types.dat');
  const typesMap = new Map();
  const typesArray = [];

  if (typesResult.data) {
    const typesData = typesResult.data;

    // Handle hash format
    if (typeof typesData === 'object' && !Array.isArray(typesData)) {
      for (const [key, value] of Object.entries(typesData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeType(key, value);
          typesMap.set(key.toUpperCase(), normalized);
          typesArray.push(normalized);
        }
      }
    }
    console.log(`  Found ${typesArray.length} types`);
  } else {
    console.log(`  Error: ${typesResult.error}`);
    allWarnings.push(`types.dat: ${typesResult.error}`);
  }

  results.types = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: typesArray.length,
      decodingStrategy: typesResult.format?.format || 'unknown',
      warnings: typesResult.warnings || []
    },
    data: typesArray
  };

  // 2. Export abilities (for validation)
  console.log('Exporting abilities...');
  const abilitiesResult = readDatFile('abilities.dat');
  const abilitiesSet = new Set();
  const abilitiesArray = [];

  if (abilitiesResult.data) {
    const abilitiesData = abilitiesResult.data;

    if (typeof abilitiesData === 'object' && !Array.isArray(abilitiesData)) {
      for (const [key, value] of Object.entries(abilitiesData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeAbility(key, value);
          abilitiesSet.add(key.toUpperCase());
          abilitiesArray.push(normalized);
        }
      }
    }
    console.log(`  Found ${abilitiesArray.length} abilities`);
  } else {
    console.log(`  Error: ${abilitiesResult.error}`);
    allWarnings.push(`abilities.dat: ${abilitiesResult.error}`);
  }

  results.abilities = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: abilitiesArray.length,
      decodingStrategy: abilitiesResult.format?.format || 'unknown',
      warnings: abilitiesResult.warnings || []
    },
    data: abilitiesArray
  };

  // 3. Export species
  console.log('Exporting species...');
  const speciesResult = readDatFile('species.dat');
  const speciesArray = [];
  const evolutionsArray = [];
  let wipSkipped = 0;

  if (speciesResult.data) {
    const speciesData = speciesResult.data;

    if (typeof speciesData === 'object' && !Array.isArray(speciesData)) {
      for (const [key, value] of Object.entries(speciesData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeSpecies(key, value, typesMap, abilitiesSet);

          // The game ships real species with placeholder stats (X-forms, customs like
          // CHIMAOOZE/DRAGALISK have all-1 base stats + real_name "WIP" in the compiled
          // species.dat, yet have full sprite/cry/encounter content in-game). They are
          // referenced by the game's regional_dexes.dat, encounters and dialogue, so they
          // must NOT be dropped. Only skip entries that are truly undefined.
          if (!normalized.id && normalized.name === 'WIP') {
            wipSkipped++;
            continue;
          }

          speciesArray.push(normalized);

          // Collect evolutions for separate export
          if (normalized.evolutions && normalized.evolutions.length > 0) {
            evolutionsArray.push({
              species: normalized.species,
              speciesId: normalized.id,
              formId: normalized.formId,
              evolutions: normalized.evolutions
            });
          }

          if (normalized._warnings) {
            allWarnings.push(...normalized._warnings.map(w => `${key}: ${w}`));
          }
        }
      }
    }
    console.log(`  Found ${speciesArray.length} species entries (skipped ${wipSkipped} WIP/incomplete entries)`);

    // Count unique species and forms
    const uniqueSpecies = new Set(speciesArray.map(s => s.species));
    const formCount = speciesArray.filter(s => s.formId > 0).length;
    console.log(`  Unique species: ${uniqueSpecies.size}, Forms: ${formCount}`);
  } else {
    console.log(`  Error: ${speciesResult.error}`);
    allWarnings.push(`species.dat: ${speciesResult.error}`);
  }

  results.species = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: speciesArray.length,
      uniqueSpecies: new Set(speciesArray.map(s => s.species)).size,
      formsCount: speciesArray.filter(s => s.formId > 0).length,
      decodingStrategy: speciesResult.format?.format || 'unknown',
      warnings: speciesResult.warnings || []
    },
    data: speciesArray
  };

  results.evolutions = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: evolutionsArray.length,
      decodingStrategy: 'derived-from-species.dat',
      warnings: []
    },
    data: evolutionsArray
  };

  // 4. Export moves
  console.log('Exporting moves...');
  const movesResult = readDatFile('moves.dat');
  const movesArray = [];

  if (movesResult.data) {
    const movesData = movesResult.data;

    if (typeof movesData === 'object' && !Array.isArray(movesData)) {
      for (const [key, value] of Object.entries(movesData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeMove(key, value, typesMap);
          movesArray.push(normalized);

          if (normalized._warnings) {
            allWarnings.push(...normalized._warnings.map(w => `${key}: ${w}`));
          }
        }
      }
    }
    console.log(`  Found ${movesArray.length} moves`);
  } else {
    console.log(`  Error: ${movesResult.error}`);
    allWarnings.push(`moves.dat: ${movesResult.error}`);
  }

  results.moves = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: movesArray.length,
      decodingStrategy: movesResult.format?.format || 'unknown',
      warnings: movesResult.warnings || []
    },
    data: movesArray
  };

  // 5. Check for learnsets (they may be embedded in species or separate)
  console.log('Checking for learnsets...');

  // Check if learnsets are in species data
  let hasLearnsets = false;
  const learnsetsArray = [];

  for (const species of speciesArray) {
    // Use species.id to look up raw data - this is the full key including form suffix
    // e.g., "TRISHOUT_2" for Xenoversal form, not just "TRISHOUT"
    const speciesData = speciesResult.data?.[species.id];
    if (speciesData) {
      const learnset = {
        species: species.species,
        speciesId: species.id,
        formId: species.formId,
        levelUp: [],
        tm: [],
        tutor: [],
        egg: [],
        special: []
      };

      // Check various learnset formats
      if (Array.isArray(speciesData.moves) || Array.isArray(speciesData.level_moves)) {
        const moves = speciesData.moves || speciesData.level_moves;
        learnset.levelUp = moves.map(m => {
          if (Array.isArray(m)) {
            return { level: m[0], move: m[1] };
          }
          return m;
        });
        hasLearnsets = true;
      }

      if (Array.isArray(speciesData.tutor_moves)) {
        learnset.tutor = speciesData.tutor_moves;
        hasLearnsets = true;
      }

      if (Array.isArray(speciesData.egg_moves)) {
        learnset.egg = speciesData.egg_moves;
        hasLearnsets = true;
      }

      if (hasLearnsets) {
        learnsetsArray.push(learnset);
      }
    }
  }

  if (hasLearnsets) {
    console.log(`  Found learnset data for ${learnsetsArray.length} species`);
    results.learnsets = {
      meta: {
        exportTime: new Date().toISOString(),
        commitHash,
        count: learnsetsArray.length,
        decodingStrategy: 'embedded-in-species.dat',
        warnings: []
      },
      data: learnsetsArray
    };
  } else {
    console.log('  No separate learnset data found (may be embedded or absent)');
    results.learnsets = {
      meta: {
        exportTime: new Date().toISOString(),
        commitHash,
        count: 0,
        decodingStrategy: 'not-found',
        warnings: [],
        note: 'Learnset data not found as separate structure. May be embedded in species.dat under different key names or absent from this game version.'
      },
      data: []
    };
  }

  // 6. Export Encounters
  console.log('Exporting encounters...');
  const encountersResult = readDatFile('encounters.dat');
  const encountersArray = [];

  if (encountersResult.data) {
    const encountersData = encountersResult.data;
    if (typeof encountersData === 'object' && !Array.isArray(encountersData)) {
      for (const [key, value] of Object.entries(encountersData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeEncounter(key, value, mapInfos);
          encountersArray.push(normalized);
        }
      }
    }
    console.log(`  Found ${encountersArray.length} encounter entries`);
  } else {
    console.log(`  Error: ${encountersResult.error}`);
    allWarnings.push(`encounters.dat: ${encountersResult.error}`);
  }

  results.encounters = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: encountersArray.length,
      decodingStrategy: encountersResult.format?.format || 'unknown',
      warnings: encountersResult.warnings || []
    },
    data: encountersArray
  };

  // 7. Export Items (Canonical Layer A)
  console.log('Exporting items...');
  const itemsResult = readDatFile('items.dat');
  const itemsArray = [];
  const itemsMap = new Map();

  if (itemsResult.data) {
    const itemsData = itemsResult.data;
    if (typeof itemsData === 'object' && !Array.isArray(itemsData)) {
      for (const [key, value] of Object.entries(itemsData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeItem(key, value);
          itemsArray.push(normalized);
          itemsMap.set(normalized.id.toUpperCase(), normalized);
        }
      }
    }
    console.log(`  Found ${itemsArray.length} items`);
  } else {
    console.log(`  Error: ${itemsResult.error}`);
    allWarnings.push(`items.dat: ${itemsResult.error}`);
  }

  results.items = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: itemsArray.length,
      decodingStrategy: itemsResult.format?.format || 'unknown',
      warnings: itemsResult.warnings || []
    },
    data: itemsArray
  };

  // 8. Export Trainers (Canonical Layer A)
  console.log('Exporting trainers...');
  const trainersResult = readDatFile('trainers.dat');
  const trainersArray = [];
  const trainersMap = new Map();

  if (trainersResult.data) {
    const trainersData = trainersResult.data;
    if (typeof trainersData === 'object' && !Array.isArray(trainersData)) {
      for (const [key, value] of Object.entries(trainersData)) {
        if (value && typeof value === 'object' && value.__class__) {
          const normalized = normalizeTrainer(key, value);
          trainersArray.push(normalized);
          trainersMap.set(normalized.id, normalized);
        }
      }
    }
    console.log(`  Found ${trainersArray.length} trainers`);
  } else {
    console.log(`  Error: ${trainersResult.error}`);
    allWarnings.push(`trainers.dat: ${trainersResult.error}`);
  }

  results.trainers = {
    meta: {
      exportTime: new Date().toISOString(),
      commitHash,
      count: trainersArray.length,
      decodingStrategy: trainersResult.format?.format || 'unknown',
      warnings: trainersResult.warnings || []
    },
    data: trainersArray
  };


  // Write all outputs
  console.log('\nWriting output files...');

  for (const [name, data] of Object.entries(results)) {
    const outPath = join(OUT_DIR, `${name}.json`);
    writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log(`  ${outPath}`);
  }

  // Write signature report
  const signatureReportPath = join(OUT_DIR, 'file_signatures.json');
  writeFileSync(signatureReportPath, JSON.stringify({
    exportTime: new Date().toISOString(),
    files: signatureReport
  }, null, 2));
  console.log(`  ${signatureReportPath}`);

  // Write meta.json for diff tool
  const metaPath = join(OUT_DIR, 'meta.json');
  writeFileSync(metaPath, JSON.stringify({
    commitHash: commitHash || 'unknown',
    exportTime: new Date().toISOString(),
    counts: {
      species: results.species.meta.count,
      items: results.items.meta.count,
      trainers: results.trainers.meta.count,
      world_facts: results.world_facts ? results.world_facts.length : 0 // world facts handled separately?
    }
  }, null, 2));
  console.log(`  ${metaPath}`);

  // Summary
  const duration = Date.now() - startTime;
  console.log(`\nExport completed in ${duration}ms`);
  console.log(`Species: ${results.species.meta.count}`);
  console.log(`Moves: ${results.moves.meta.count}`);
  console.log(`Types: ${results.types.meta.count}`);
  console.log(`Abilities: ${results.abilities.meta.count}`);
  console.log(`Evolutions: ${results.evolutions.meta.count}`);
  console.log(`Learnsets: ${results.learnsets.meta.count}`);
  console.log(`Encounters: ${results.encounters.meta.count}`);
  console.log(`Items: ${results.items.meta.count}`);
  console.log(`Trainers: ${results.trainers.meta.count}`);

  if (allWarnings.length > 0) {
    console.log(`\nWarnings (${allWarnings.length}):`);
    allWarnings.slice(0, 10).forEach(w => console.log(`  - ${w}`));
    if (allWarnings.length > 10) {
      console.log(`  ... and ${allWarnings.length - 10} more`);
    }
  }

  return {
    success: results.species.meta.count > 0 && results.moves.meta.count > 0,
    results,
    warnings: allWarnings,
    duration
  };
}

// Run if executed directly
const result = exportAll();
process.exit(result.success ? 0 : 1);
