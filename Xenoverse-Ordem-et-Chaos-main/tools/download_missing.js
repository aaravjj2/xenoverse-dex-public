
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');
const REPO_ROOT = join(__dirname, '..');
const ICONS_DIR = join(REPO_ROOT, 'Graphics/Pokemon/Icons');

// Ensure directory exists
if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

console.log('Scanning for missing images...');

// Get all species
const species = db.prepare(`
    SELECT s.id, s.dex_number, a.icon_path, s.name
    FROM species s
    LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
    WHERE s.form_id = 0
`).all();

let downloadCount = 0;
let updateCount = 0;

async function downloadImage(url, destPath) {
    try {
        const response = await fetch(url);
        if (!response.ok) return false;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        writeFileSync(destPath, buffer);
        return true;
    } catch (e) {
        console.error(`Error downloading ${url}:`, e.message);
        return false;
    }
}

let speciesToDexMap = {};
try {
    const mappingContent = readFileSync(join(REPO_ROOT, 'apps/dex/src/lib/dexMapping.ts'), 'utf8');
    // Regex to match 'NAME': NUMBER,
    const regex = /'([A-Z0-9_\-]+)':\s*(\d+)/g;
    let match;
    while ((match = regex.exec(mappingContent)) !== null) {
        speciesToDexMap[match[1]] = parseInt(match[2]);
    }
    console.log(`Loaded ${Object.keys(speciesToDexMap).length} mappings from dexMapping.ts`);
} catch (e) {
    console.error('Failed to load dexMapping.ts:', e.message);
    process.exit(1);
}

async function processSpecies() {
    for (const s of species) {
        let needsDownload = false;
        let targetPath = s.icon_path;
        let needsDbUpdate = false;

        // Case 1: No path in DB
        if (!s.icon_path) {
            targetPath = `Graphics/Pokemon/Icons/${s.id}.png`;
            needsDownload = true;
            needsDbUpdate = true;
        }
        // Case 2: Path exists but file missing
        else {
            const absPath = join(REPO_ROOT, s.icon_path);
            if (!existsSync(absPath)) {
                needsDownload = true;
                // Keep existing path
            }
        }

        if (needsDownload) {
            // Use loaded map
            const pokeApiId = speciesToDexMap[s.id];

            if (!pokeApiId) {
                // console.log(`Skipping ${s.name} (No Dex Mapping for ${s.id})`);
                continue;
            }

            const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokeApiId}.png`;
            const destAbsPath = join(REPO_ROOT, targetPath);

            // console.log(`Downloading ${s.name} (#${pokeApiId}) to ${targetPath}...`);

            const success = await downloadImage(url, destAbsPath);

            if (success) {
                downloadCount++;
                if (needsDbUpdate) {
                    // Update DB keys: species_id, form_id
                    // Check if asset row exists
                    const row = db.prepare('SELECT * FROM assets WHERE species_id = ? AND form_id = 0').get(s.id);
                    if (row) {
                        db.prepare('UPDATE assets SET icon_path = ? WHERE species_id = ? AND form_id = 0').run(targetPath, s.id);
                    } else {
                        // Insert new row
                        db.prepare('INSERT INTO assets (species_id, form_id, icon_path) VALUES (?, 0, ?)').run(s.id, targetPath);
                    }
                    updateCount++;
                }
            } else {
                console.warn(`Failed to download for ${s.name} from ${url}`);
            }
        }
    }
    console.log(`\nDownload Complete.`);
    console.log(`Downloaded: ${downloadCount} images`);
    console.log(`DB Updates: ${updateCount} records`);
}

processSpecies();
