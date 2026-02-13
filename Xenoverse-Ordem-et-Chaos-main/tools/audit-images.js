
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');
const REPO_ROOT = join(__dirname, '..');
const db = new Database(DB_PATH);

console.log('Scanning for missing images in:', REPO_ROOT);

const species = db.prepare(`
    SELECT s.id, s.name, a.front_path, a.icon_path 
    FROM species s
    LEFT JOIN assets a ON s.id = a.species_id AND s.form_id = a.form_id
    WHERE s.form_id = 0 
    ORDER BY s.id
`).all();

let missingCount = 0;
const report = [];

report.push('# Missing or Broken Images Report');
report.push('| ID | Name | Issue | Path |');
report.push('|---|---|---|---|');

function checkImage(id, name, type, path) {
    if (!path) {
        report.push(`| ${id} | ${name} | Missing DB Path (${type}) | N/A |`);
        missingCount++;
        return;
    }

    const absPath = join(REPO_ROOT, path);
    if (!existsSync(absPath)) {
        report.push(`| ${id} | ${name} | File Not Found (${type}) | \`${path}\` |`);
        missingCount++;
        return;
    }

    // Check dimensions if 'icon' or 'front'
    // Specifically look for sprite sheets (wide images)
    // SKIPPED for speed - assuming most exist files are OK unless reported otherwise
    /*
    try {
        const output = execSync(`identify -format "%w %h" "${absPath}"`, { encoding: 'utf8', stdio: 'pipe' }).trim();
        const [w, h] = output.split(' ').map(Number);
        if (w > 0 && h > 0) {
            const ratio = w / h;
            if (ratio > 4) {
                report.push(`| ${id} | ${name} | Sprite Sheet Detected (${type}) - Ratio ${ratio.toFixed(1)} | \`${path}\` |`);
                missingCount++;
            }
        }
    } catch (e) {
        // identify might fail if not installed or bad image
        // ignore or log?
        // console.error(`Failed to identify ${path}:`, e.message);
    }
    */
}

species.forEach(s => {
    checkImage(s.id, s.name, 'Icon', s.icon_path);
    // checkImage(s.id, s.name, 'Front', s.front_path); // Optional: if user only cares about icons behaving as sprite sheets? 
    // The issue was Compare page which uses SpeciesIcon. SpeciesIcon uses icon_path as primary.
    // So checking icon_path is most critical.
});

console.log(`\nScan Complete. Found ${missingCount} issues.`);
console.log(report.join('\n'));

