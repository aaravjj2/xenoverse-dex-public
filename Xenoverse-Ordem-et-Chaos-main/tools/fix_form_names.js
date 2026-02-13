
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('out/dex.db');

const rows = db.prepare("SELECT id, name FROM species").all();
let updates = 0;

const updateStmt = db.prepare("UPDATE species SET name = ? WHERE id = ?");

for (const row of rows) {
    let newName = row.name;
    let changed = false;

    // Helper: Check if base ID exists
    const checkBase = (suffix) => {
        const baseId = row.id.slice(0, -suffix.length);
        const baseExists = db.prepare("SELECT 1 FROM species WHERE id = ?").get(baseId);
        return !!baseExists;
    };

    // Check ID Suffixes
    if (row.id.endsWith('X')) {
        // Only rename if it's a form of an existing base (e.g. TRISHOUT -> TRISHOUTX)
        // AND not already named with X
        if (checkBase('X') && !row.name.endsWith(' X') && !row.name.includes('Astral')) {
            newName = `${row.name} X`;
            changed = true;
        }
    } else if (row.id.endsWith('V')) {
        if (checkBase('V') && !row.name.endsWith(' Vintage')) {
            newName = `${row.name} Vintage`;
            changed = true;
        }
    } else {
        // Handle _1, _2 pattern (Battle forms usually)
        const match = row.id.match(/_(\d+)$/);
        if (match) {
            const num = match[1];
            // Check if base exists (e.g. TRISHOUT_1 -> TRISHOUT)
            const baseId = row.id.replace(`_${num}`, '');
            const baseExists = db.prepare("SELECT 1 FROM species WHERE id = ?").get(baseId);

            if (baseExists && !row.name.includes(`Form ${num}`) && !row.name.includes(`(${num})`)) {
                newName = `${row.name} (Form ${num})`;
                changed = true;
            }
        }
    }

    if (changed) {
        console.log(`Renaming [${row.id}] '${row.name}' -> '${newName}'`);
        updateStmt.run(newName, row.id);
        updates++;
    }
}

console.log(`Updated ${updates} names.`);
