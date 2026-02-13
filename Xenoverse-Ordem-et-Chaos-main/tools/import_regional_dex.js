
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');
const REPO_ROOT = join(__dirname, '..');
const DEX_FILE = join(REPO_ROOT, '../regional_dexes.txt');

const db = new Database(DB_PATH);

if (!existsSync(DEX_FILE)) {
    console.error(`File not found: ${DEX_FILE}`);
    process.exit(1);
}

// Create table
db.exec(`
    CREATE TABLE IF NOT EXISTS regional_dex (
        species_id TEXT NOT NULL,
        dex_section INTEGER DEFAULT 0,
        sort_order INTEGER,
        PRIMARY KEY (species_id)
    );
`);

// Clear existing
db.exec('DELETE FROM regional_dex');

const content = readFileSync(DEX_FILE, 'utf8');
const lines = content.split('\n');

let currentSection = 0;
let sortOrder = 0;
let insertedCount = 0;
let missingInDbCount = 0;

const insertStmt = db.prepare('INSERT OR IGNORE INTO regional_dex (species_id, dex_section, sort_order) VALUES (?, ?, ?)');
const checkStmt = db.prepare('SELECT id FROM species WHERE id = ?');

console.log('Parsing regional_dexes.txt...');

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    // Check for section header [0], [1]
    const sectionMatch = line.match(/^\[(\d+)\]$/);
    if (sectionMatch) {
        currentSection = parseInt(sectionMatch[1]);
        console.log(`Switched to Section [${currentSection}]`);
        continue;
    }

    // Split CSV
    const ids = line.split(',').map(s => s.trim()).filter(s => s.length > 0);

    for (const id of ids) {
        // ID in text file might not match DB exactly?
        // DB IDs are usually UPPERCASE. Content seems uppercase.
        // Some might contain special chars?

        const dbId = id.toUpperCase();

        // Check if exists in species table
        const exists = checkStmt.get(dbId);

        if (!exists) {
            console.warn(`Warning: Species '${id}' in text file NOT FOUND in DB keys.`);
            missingInDbCount++;
        } else {
            insertStmt.run(dbId, currentSection, sortOrder);
            insertedCount++;
        }
        sortOrder++;
    }
}

console.log(`\nImport Complete.`);
console.log(`Inserted: ${insertedCount} species into regional_dex.`);
console.log(`Missing in DB: ${missingInDbCount} (names in text but not in DB).`);
