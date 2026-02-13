/**
 * World Parser for Xenoverse Dex
 * Extracts best-effort location facts from map/event data (Layer B: Derived)
 * AND integrates deep game data (Layer A: Static Data) for maximum coverage.
 * 
 * Supported patterns:
 * - Give Item: pbReceiveItem*, pbAddItem
 * - Trainer Battle: TrainerBattle.start, pbTrainerBattle (Enriched with Party data)
 * - Shop: pbPokemonMart
 * - Wild Encounters: From encounters.json (Enriched with Level/Type)
 * - Move Tutors: pbChooseMoveList (Inferred)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from './marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const DATA_DIR = join(REPO_ROOT, 'Data');
const OUT_DIR = join(REPO_ROOT, 'out');

// --- DATA LOADING LAYER ---

/**
 * Load static game data from 'out/' directory.
 * This data is used to enrich the facts extracted from map scripts.
 */
function loadGameData() {
    console.log('Loading static game data from out/...');
    const data = {
        encounters: [],
        items: [],
        trainers: [],
        moves: [],
        species: []
    };

    try {
        if (existsSync(join(OUT_DIR, 'encounters.json'))) {
            data.encounters = JSON.parse(readFileSync(join(OUT_DIR, 'encounters.json'), 'utf-8')).data;
        }
        if (existsSync(join(OUT_DIR, 'items.json'))) {
            data.items = JSON.parse(readFileSync(join(OUT_DIR, 'items.json'), 'utf-8')).data;
        }
        if (existsSync(join(OUT_DIR, 'trainers.json'))) {
            data.trainers = JSON.parse(readFileSync(join(OUT_DIR, 'trainers.json'), 'utf-8')).data;
        }
        if (existsSync(join(OUT_DIR, 'moves.json'))) {
            data.moves = JSON.parse(readFileSync(join(OUT_DIR, 'moves.json'), 'utf-8')).data;
        }
        if (existsSync(join(OUT_DIR, 'species.json'))) {
            data.species = JSON.parse(readFileSync(join(OUT_DIR, 'species.json'), 'utf-8')).data;
        }
        console.log(`Loaded: ${data.encounters.length} Map Encounters, ${data.trainers.length} Trainers, ${data.items.length} Items.`);
    } catch (e) {
        console.warn('Error loading static game data:', e.message);
    }
    return data;
}

/**
 * Load MapInfos to resolve map names
 */
function loadMapInfos() {
    const mapInfos = new Map();
    try {
        const buffer = readFileSync(join(DATA_DIR, 'MapInfos.rxdata'));
        const result = decode(buffer);
        if (result.data && typeof result.data === 'object') {
            for (const [key, value] of Object.entries(result.data)) {
                if (value && value.name) {
                    mapInfos.set(Number(key), value.name);
                }
            }
        }
    } catch (e) {
        console.warn('Could not load MapInfos.rxdata:', e.message);
    }
    return mapInfos;
}

// --- EXTRACTION HELPERS ---

/**
 * Extract item ID from script pattern
 */
function extractItemId(script) {
    const symbolMatch = script.match(/:([A-Z][A-Z0-9_]+)(?:[\s,)])/);
    if (symbolMatch) return symbolMatch[1];

    const symbolSimple = script.match(/:([A-Z][A-Z0-9_]+)/);
    if (symbolSimple) return symbolSimple[1];

    const quotedMatch = script.match(/["']([A-Z][A-Z0-9_]+)["']/i);
    if (quotedMatch && !quotedMatch[1].includes('.')) {
        return quotedMatch[1].toUpperCase();
    }

    return null;
}

/**
 * Extract trainer info from script pattern
 */
function extractTrainerInfo(script) {
    const trainers = [];

    // Pattern 1: :TYPE, "Name" or :TYPE, _I("Name")
    const pattern1 = /:([A-Z0-9_]+),\s*(?:_I\(\s*)?["']([^"']+)["'](?:\s*\))?/g;
    let match;
    while ((match = pattern1.exec(script)) !== null) {
        trainers.push({
            trainerType: match[1],
            trainerName: match[2],
            confidence: 'high'
        });
    }

    // Pattern 2: PBTrainers::TYPE, "Name"
    const pattern2 = /PBTrainers::([A-Z0-9_]+),\s*(?:_I\(\s*)?["']([^"']+)["'](?:\s*\))?/g;
    while ((match = pattern2.exec(script)) !== null) {
        const exists = trainers.some(t => t.trainerType === match[1] && t.trainerName === match[2]);
        if (!exists) {
            trainers.push({
                trainerType: match[1],
                trainerName: match[2],
                confidence: 'high'
            });
        }
    }

    // Pattern 3: pbTrainerBattle/pbDoubleTrainerBattle with various formats
    if (script.includes('TrainerBattle') || script.includes('pbTrainer')) {
        const allTrainerRefs = script.matchAll(/(?::|PBTrainers::)([A-Z0-9_]+),\s*(?:_I\(\s*)?["']([^"']+)["'](?:\s*\))?/g);
        for (const m of allTrainerRefs) {
            const exists = trainers.some(t => t.trainerType === m[1] && t.trainerName === m[2]);
            if (!exists) {
                trainers.push({
                    trainerType: m[1],
                    trainerName: m[2],
                    confidence: 'high'
                });
            }
        }
    }

    // Pattern 4: pbTrainerIntro(:TYPE)
    const introPattern = /pbTrainerIntro\s*\(\s*:([A-Z0-9_]+)\s*\)/g;
    while ((match = introPattern.exec(script)) !== null) {
        const trainerType = match[1];
        const exists = trainers.some(t => t.trainerType === trainerType);
        if (!exists) {
            trainers.push({
                trainerType: trainerType,
                trainerName: null,
                confidence: 'medium',
                isIntroOnly: true
            });
        }
    }

    // Pattern 5: EliteBattle.set(:nextBattleScript, :TYPE)
    const ebdxPattern = /EliteBattle\.set\(:nextBattleScript,\s*:([A-Z0-9_]+)\)/g;
    while ((match = ebdxPattern.exec(script)) !== null) {
        const trainerType = match[1];
        const exists = trainers.some(t => t.trainerType === trainerType);
        if (!exists) {
            trainers.push({
                trainerType: trainerType,
                trainerName: null,
                confidence: 'medium',
                isIntroOnly: true
            });
        }
    }

    return trainers.length > 0 ? trainers : null;
}

/**
 * Extract shop items from script
 */
function extractShopItems(script) {
    const items = [];
    const matches = script.matchAll(/:([A-Z][A-Z0-9_]+)/g);
    for (const match of matches) {
        items.push(match[1]);
    }
    return items;
}

// --- FACT GENERATION FROM DATA ---

/**
 * Generate facts from Encounters JSON
 */
function processMapEncounters(data, mapInfos) {
    const facts = [];
    for (const mapData of data.encounters) {
        const mapId = mapData.mapId;
        const mapName = mapInfos.get(mapId) || mapData.mapName || `Map ${mapId}`;

        if (!mapData.slots) continue;

        for (const slot of mapData.slots) {
            facts.push({
                id: null,
                type: 'wild_encounter',
                mapId: mapId,
                mapName: mapName,
                eventId: null,
                pageIndex: null,
                commandIndex: null,
                payload: {
                    species: slot.species,
                    levelMin: slot.minLevel,
                    levelMax: slot.maxLevel,
                    encounterType: slot.type, // Grass, Water, etc.
                    chance: slot.chance
                },
                confidence: 'high',
                reason: `Wild Encounters Table (${slot.type})`,
                rawSnippet: null, // Derived from data, not script
                conditions: null
            });
        }
    }
    return facts;
}

/**
 * Find Trainer Party Data
 */
function findTrainerParty(type, name, trainersDB) {
    if (!trainersDB || !name) return null;
    // Trainer ID format in DB: "TYPE,Name,Version"
    // We try version 0 first
    const id = `${type},${name},0`;
    const trainer = trainersDB.find(t => t.id === id);
    if (trainer) return trainer.party;

    // Fuzzy search if exact match fails
    return trainersDB.find(t => t.trainerType === type && t.name === name)?.party || null;
}

// --- MAP PARSING ---

function parseMapFile(mapId, mapInfos, contextData) {
    const facts = [];
    const filename = `Map${String(mapId).padStart(3, '0')}.rxdata`;
    const filepath = join(DATA_DIR, filename);

    if (!existsSync(filepath)) {
        return { facts, error: 'File not found' };
    }

    try {
        const buffer = readFileSync(filepath);
        const result = decode(buffer);
        const mapData = result.data;

        if (!mapData || !mapData.events) {
            return { facts, error: 'No events in map' };
        }

        const mapName = mapInfos.get(mapId) || `Map ${mapId}`;

        for (const [eventId, event] of Object.entries(mapData.events)) {
            if (!event || !event.pages) continue;

            for (let pageIndex = 0; pageIndex < event.pages.length; pageIndex++) {
                const page = event.pages[pageIndex];
                if (!page.list) continue;

                let currentScript = '';
                let scriptStartIndex = -1;

                for (let cmdIndex = 0; cmdIndex < page.list.length; cmdIndex++) {
                    const cmd = page.list[cmdIndex];

                    if (cmd.code === 355) {
                        if (currentScript) {
                            processScript(currentScript, scriptStartIndex, facts, {
                                mapId, mapName, eventId: Number(eventId), pageIndex, eventName: event.name,
                                contextData
                            });
                        }
                        currentScript = cmd.parameters?.join(' ') || '';
                        scriptStartIndex = cmdIndex;
                    } else if (cmd.code === 655) {
                        currentScript += ' ' + (cmd.parameters?.join(' ') || '');
                    } else if (cmd.code === 111) {
                        if (cmd.parameters[0] === 12 && typeof cmd.parameters[1] === 'string') {
                            processScript(cmd.parameters[1], cmdIndex, facts, {
                                mapId, mapName, eventId: Number(eventId), pageIndex, eventName: event.name,
                                contextData
                            });
                        }
                    } else if (currentScript) {
                        processScript(currentScript, scriptStartIndex, facts, {
                            mapId, mapName, eventId: Number(eventId), pageIndex, eventName: event.name,
                            contextData
                        });
                        currentScript = '';
                        scriptStartIndex = -1;
                    }
                }

                if (currentScript) {
                    processScript(currentScript, scriptStartIndex, facts, {
                        mapId, mapName, eventId: Number(eventId), pageIndex, eventName: event.name,
                        contextData
                    });
                }

                // conditions... (omitted detailed extraction for brevity in this enriched version, but logic kept same)
                const conditions = extractConditions(page.condition);
                for (const fact of facts) {
                    if (!fact.conditions) {
                        fact.conditions = conditions;
                    }
                }
            }
        }
        return { facts };
    } catch (e) {
        return { facts, error: e.message };
    }
}


function processScript(script, cmdIndex, facts, context) {
    const { mapId, mapName, eventId, pageIndex, eventName, contextData } = context;
    const lowerScript = script.toLowerCase();

    // 1. ITEMS
    if (lowerScript.includes('receiveitem') || lowerScript.includes('additem') || lowerScript.includes('itemball') || lowerScript.includes('pickupitem')) {
        const itemId = extractItemId(script);
        if (itemId) {
            const nameIsHidden = eventName && (eventName.toLowerCase().includes('hidden') || eventName.includes('HiddenItem'));
            const scriptIsHidden = lowerScript.includes('hidden') || lowerScript.includes('pickup');

            facts.push({
                id: null,
                type: (scriptIsHidden || nameIsHidden) ? 'hidden_item' : 'item_location',
                mapId,
                mapName,
                eventId,
                pageIndex,
                commandIndex: cmdIndex,
                payload: { itemId },
                confidence: 'high',
                reason: `Item match (${extractMethodName(script)})${nameIsHidden ? ' [Event Name Hint]' : ''}`,
                rawSnippet: script.slice(0, 150),
                conditions: null
            });
        }
    }

    // 2. TRAINERS (Deep Enriched)
    if (lowerScript.includes('trainerbattle') || lowerScript.includes('pbtrainer') || lowerScript.includes('elitebattle')) {
        const trainers = extractTrainerInfo(script);
        if (trainers && trainers.length > 0) {
            const isDouble = script.includes('Double');
            for (const trainer of trainers) {
                const trainerId = trainer.trainerName
                    ? `${trainer.trainerType},${trainer.trainerName},0`
                    : null;

                // Lookup Party Data
                let party = null;
                if (trainer.trainerName && contextData && contextData.trainers) {
                    party = findTrainerParty(trainer.trainerType, trainer.trainerName, contextData.trainers);
                }

                let reason = 'Direct TrainerBattle pattern match';
                if (isDouble) reason = 'Double trainer battle';
                else if (trainer.isIntroOnly) reason = 'Trainer intro setup';

                facts.push({
                    id: null,
                    type: 'trainer_location',
                    mapId,
                    mapName,
                    eventId,
                    pageIndex,
                    commandIndex: cmdIndex,
                    payload: {
                        trainerType: trainer.trainerType,
                        trainerName: trainer.trainerName,
                        trainerId: trainerId,
                        isDoubleBattle: isDouble,
                        isIntroOnly: trainer.isIntroOnly || false,
                        party: party // ENRICHED DATA
                    },
                    confidence: trainer.confidence || 'high',
                    reason: reason,
                    rawSnippet: script.slice(0, 200),
                    conditions: null
                });
            }
        }
    }

    // 3. SHOPS
    if (lowerScript.includes('mart') || lowerScript.includes('pokemonmart')) {
        const shopItems = extractShopItems(script);
        if (shopItems.length > 0) {
            facts.push({
                id: null,
                type: 'shop',
                mapId,
                mapName,
                eventId,
                pageIndex,
                commandIndex: cmdIndex,
                payload: { items: shopItems },
                confidence: shopItems.length > 0 ? 'high' : 'medium',
                reason: `Shop pattern match (${extractMethodName(script)})`,
                rawSnippet: script.slice(0, 200),
                conditions: null
            });
        }
    }

    // 4. STATIC ENCOUNTERS
    if (lowerScript.includes('wildbattle') || lowerScript.includes('pbwildbattle')) {
        const pokemonId = extractItemId(script);
        if (pokemonId) {
            const levelMatch = script.match(/,\s*(\d+)/);
            const level = levelMatch ? parseInt(levelMatch[1]) : null;

            facts.push({
                id: null,
                type: 'static_encounter',
                mapId,
                mapName,
                eventId,
                pageIndex,
                commandIndex: cmdIndex,
                payload: { pokemonId, level },
                confidence: 'high',
                reason: `Static encounter (${extractMethodName(script)})`,
                rawSnippet: script.slice(0, 150),
                conditions: null
            });
        }
    }

    // 5. GIFTS
    if (lowerScript.includes('addpokemon') || lowerScript.includes('generateegg')) {
        const pokemonId = extractItemId(script);
        if (pokemonId) {
            const isEgg = lowerScript.includes('egg');
            facts.push({
                id: null,
                type: 'gift_pokemon',
                mapId,
                mapName,
                eventId,
                pageIndex,
                commandIndex: cmdIndex,
                payload: { pokemonId, isEgg },
                confidence: 'high',
                reason: `Gift Pokémon (${extractMethodName(script)})`,
                rawSnippet: script.slice(0, 150),
                conditions: null
            });
        }
    }

    // 6. MOVE TUTORS (Inferred)
    // Matches: pbChooseMoveList
    if (lowerScript.includes('choosemovelist')) {
        facts.push({
            id: null,
            type: 'move_tutor',
            mapId,
            mapName,
            eventId,
            pageIndex,
            commandIndex: cmdIndex,
            payload: { inferred: true },
            confidence: 'medium',
            reason: `Move Tutor interaction detected (${extractMethodName(script)})`,
            rawSnippet: script.slice(0, 150),
            conditions: null
        });
    }
}

function extractMethodName(script) {
    const match = script.match(/([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+|[a-zA-Z0-9_]+)\(/);
    return match ? match[1] : 'script';
}

function extractConditions(condition) {
    if (!condition) return {};
    const conditions = {};
    if (condition.switch1_valid) conditions.switch1 = condition.switch1_id;
    if (condition.switch2_valid) conditions.switch2 = condition.switch2_id;
    if (condition.variable_valid) conditions.variable = { id: condition.variable_id, value: condition.variable_value };
    if (condition.self_switch_valid) conditions.selfSwitch = condition.self_switch_ch;
    return conditions;
}

function generateReport(facts, stats) {
    const lines = [
        '# World Extraction Report (Deep Enriched)',
        '',
        `**Generated:** ${new Date().toISOString()}`,
        '',
        '## Summary',
        '',
        `| Metric | Count |`,
        `|--------|-------|`,
        `| Maps Parsed | ${stats.mapsParsed} |`,
        `| Events Scanned | ${stats.eventsScanned} |`,
        `| Total Facts Extracted | ${facts.length} |`,
        '',
        '## Facts by Type',
        ''
    ];

    const byType = {};
    for (const fact of facts) {
        byType[fact.type] = (byType[fact.type] || 0) + 1;
    }

    lines.push('| Type | Count |');
    lines.push('|------|-------|');
    for (const [type, count] of Object.entries(byType)) {
        lines.push(`| ${type} | ${count} |`);
    }

    return lines.join('\n');
}

/**
 * Main extraction function
 */
export function extractWorldFacts() {
    console.log('Starting DEEP world extraction...\n');
    const startTime = Date.now();

    // 1. Load Static Data
    const contextData = loadGameData();
    const mapInfos = loadMapInfos();
    console.log(`Loaded ${mapInfos.size} map names`);

    const allFacts = [];
    const stats = {
        mapsParsed: 0,
        eventsScanned: 0,
        errors: []
    };

    // 2. Generate Facts from Encounters Data
    /*
    console.log('Generating Wild Encounter facts...');
    const encounterFacts = processMapEncounters(contextData, mapInfos);
    allFacts.push(...encounterFacts);
    console.log(`Generated ${encounterFacts.length} encounter facts.`);
    */
    // actually, lets verify processMapEncounters works
    if (contextData.encounters.length > 0) {
        const encounterFacts = processMapEncounters(contextData, mapInfos);
        allFacts.push(...encounterFacts);
        console.log(`Generated ${encounterFacts.length} encounter facts.`);
    }

    // 3. Parse Map Files (Scripts)
    const mapFiles = readdirSync(DATA_DIR)
        .filter(f => f.match(/^Map\d{3}\.rxdata$/))
        .map(f => parseInt(f.match(/Map(\d+)/)[1]))
        .sort((a, b) => a - b);

    console.log(`Found ${mapFiles.length} map files to parse`);

    for (const mapId of mapFiles) {
        const { facts, error } = parseMapFile(mapId, mapInfos, contextData);

        if (error) {
            stats.errors.push({ mapId, error });
        } else {
            stats.mapsParsed++;
            allFacts.push(...facts);
        }

        if (mapId % 50 === 0) console.log(`  Processed map ${mapId}...`);
    }

    // Assign IDs
    for (let i = 0; i < allFacts.length; i++) {
        allFacts[i].id = i + 1;
    }

    console.log(`\nExtracted ${allFacts.length} total facts from ${stats.mapsParsed} maps + static data.`);

    // Write outputs
    const factsPath = join(OUT_DIR, 'world_facts.json');
    const reportPath = join(OUT_DIR, 'world_extraction_report.md');

    const factsOutput = {
        meta: {
            exportTime: new Date().toISOString(),
            count: allFacts.length,
            mapsParsed: stats.mapsParsed,
            layer: 'Deep-Enriched'
        },
        data: allFacts
    };

    writeFileSync(factsPath, JSON.stringify(factsOutput, null, 2));
    writeFileSync(reportPath, generateReport(allFacts, stats));

    console.log(`\nWorld extraction completed in ${Date.now() - startTime}ms`);
}

extractWorldFacts();
