

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('out/dex.db');


const rows = db.prepare("SELECT species_id, icon_path FROM assets").all();

let missing = [];
let total = 0;
let present = 0;

console.log('Checking ' + rows.length + ' assets...');

for (const row of rows) {
    if (!row.icon_path) continue;
    total++;
    const filePath = path.join(__dirname, '..', row.icon_path); // db path is relative to root usually? "Graphics/..."

    // Check Case Sensitive (Linux)
    // fs.existsSync is case insensitive on Windows/Mac sometimes, but strict on Linux.
    // However, we want to know if the EXACT filename exists.

    if (!fs.existsSync(filePath)) {
        missing.push({ id: row.species_id, path: row.icon_path });
    } else {
        present++;
    }
}

console.log(`\nResults:`);
console.log(`Total Assets in DB: ${total}`);
console.log(`Present on Disk:    ${present}`);
console.log(`Missing on Disk:    ${missing.length}`);

if (missing.length > 0) {
    console.log('\nMissing Files (First 50):');
    missing.slice(0, 50).forEach(m => console.log(`[${m.id}] ${m.path}`));
}

if (missing.length > 50) {
    console.log(`... and ${missing.length - 50} more.`);
}
