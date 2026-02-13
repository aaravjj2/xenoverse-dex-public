
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');
const REPO_ROOT = join(__dirname, '..');

const db = new Database(DB_PATH);

// Known official Pokemon (Gen 1-9) - a subset for checking
const OFFICIAL_POKEMON = new Set([
    'BULBASAUR', 'IVYSAUR', 'VENUSAUR', 'CHARMANDER', 'CHARMELEON', 'CHARIZARD',
    'SQUIRTLE', 'WARTORTLE', 'BLASTOISE', 'CATERPIE', 'METAPOD', 'BUTTERFREE',
    'WEEDLE', 'KAKUNA', 'BEEDRILL', 'PIDGEY', 'PIDGEOTTO', 'PIDGEOT',
    'RATTATA', 'RATICATE', 'SPEAROW', 'FEAROW', 'EKANS', 'ARBOK',
    'PIKACHU', 'RAICHU', 'SANDSHREW', 'SANDSLASH', 'NIDORAN', 'NIDORINA',
    // ... this is incomplete, let's use a different approach
]);

console.log('=== Custom Pokemon Audit ===\n');

// Get all species with missing front_path
const missingAssets = db.prepare(`
    SELECT s.id, s.name, s.dex_number, a.front_path, a.icon_path
    FROM species s
    LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
    WHERE s.form_id = 0
    AND (a.front_path IS NULL)
    ORDER BY s.id
`).all();

console.log(`Total species with missing front_path: ${missingAssets.length}\n`);

// Categorize: Check if dex_number is null (likely custom) or standard
const customPokemon = [];
const standardMissing = [];

missingAssets.forEach(s => {
    // Custom Pokemon typically have no dex_number or very high dex_number
    // Or their ID doesn't match standard naming patterns
    const isLikelyCustom =
        s.dex_number === null ||
        s.dex_number > 1025 || // Beyond current official count
        s.id.includes('X') ||  // Xenoverse naming convention
        s.name.includes('X') ||
        ['BANDEON', 'ASTROPOD', 'COSMEON', 'GAIADOS', 'GALAXEOS'].some(c => s.id.includes(c));

    if (isLikelyCustom) {
        customPokemon.push(s);
    } else {
        standardMissing.push(s);
    }
});

console.log('=== CUSTOM POKEMON (Xenoverse-specific) ===');
console.log(`Count: ${customPokemon.length}`);
customPokemon.forEach(s => {
    console.log(`  - ${s.id} (${s.name}) [dex#: ${s.dex_number ?? 'N/A'}]`);
});

console.log('\n=== STANDARD POKEMON WITH MISSING ASSETS ===');
console.log(`Count: ${standardMissing.length}`);
standardMissing.slice(0, 30).forEach(s => {
    console.log(`  - ${s.id} (${s.name}) [dex#: ${s.dex_number ?? 'N/A'}]`);
});
if (standardMissing.length > 30) {
    console.log(`  ... and ${standardMissing.length - 30} more`);
}

// Triple-check: Verify these species exist in trainers/encounters/learnsets
console.log('\n=== VERIFYING PRESENCE IN GAME DATA ===');
const verifyInGame = db.prepare(`
    SELECT DISTINCT species_id FROM trainer_party WHERE species_id = ?
    UNION
    SELECT DISTINCT species_id FROM encounters WHERE species_id = ?
    UNION
    SELECT DISTINCT species_id FROM learnsets WHERE species_id = ?
`);

let presentInGame = 0;
let notInGame = 0;
const notFoundInGame = [];

missingAssets.forEach(s => {
    const rows = verifyInGame.all(s.id, s.id, s.id);
    if (rows.length > 0) {
        presentInGame++;
    } else {
        notInGame++;
        notFoundInGame.push(s.id);
    }
});

console.log(`Species with missing assets that ARE in game data: ${presentInGame}`);
console.log(`Species with missing assets NOT found in game data: ${notInGame}`);
if (notFoundInGame.length > 0) {
    console.log('\nNot found in trainers/encounters/learnsets (first 20):');
    notFoundInGame.slice(0, 20).forEach(id => console.log(`  - ${id}`));
}

db.close();
