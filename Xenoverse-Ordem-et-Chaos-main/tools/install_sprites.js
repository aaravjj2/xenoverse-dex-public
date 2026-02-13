
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('out/dex.db');

const ARTIFACTS_DIR = '/home/aarav/.gemini/antigravity/brain/1696a2b0-de5f-4cbb-9eb1-5053e82b8691';
const ICONS_DIR = path.join(__dirname, '../Graphics/Pokemon/Icons');

// Map prompt name prefix to Species ID (uppercase)
const MAPPING = {
    'gorochu': 'GOROCHU',
    'sunfoolery': 'SUNFOOLERY',
    'ferrogonal': 'FERROGONAL',
    'vyellor': 'VYELLOR',
    'scraggyx': 'SCRAGGYX',
    'galafty': 'GALAFTY'
};

// Find latest file for each prefix
const files = fs.readdirSync(ARTIFACTS_DIR);

for (const [prefix, id] of Object.entries(MAPPING)) {
    // pattern: prefix_sprite_timestamp.png
    const candidates = files.filter(f => f.startsWith(prefix + '_sprite_') && f.endsWith('.png'));
    if (candidates.length === 0) {
        console.error(`No sprite found for ${prefix}`);
        continue;
    }
    // Sort by timestamp desc
    candidates.sort();
    const latest = candidates[candidates.length - 1];

    const srcPath = path.join(ARTIFACTS_DIR, latest);
    const destName = `${id}.png`;
    const destPath = path.join(ICONS_DIR, destName);

    console.log(`Copying ${latest} -> ${destName}`);
    fs.copyFileSync(srcPath, destPath);

    // Update DB
    const relativePath = `Graphics/Pokemon/Icons/${destName}`;
    const info = db.prepare("UPDATE assets SET icon_path = ? WHERE species_id = ?").run(relativePath, id);
    if (info.changes > 0) {
        console.log(`Updated DB for ${id}`);
    } else {
        // Did we fail to match ID?
        // Maybe ID doesn't exist in assets table?
        // Insert if missing?
        const exists = db.prepare("SELECT 1 FROM assets WHERE species_id = ?").get(id);
        if (!exists) {
            console.log(`Inserting new asset record for ${id}`);
            db.prepare("INSERT INTO assets (species_id, icon_path) VALUES (?, ?)").run(id, relativePath);
        } else {
            console.warn(`Record existed but no change?`);
        }
    }
}
