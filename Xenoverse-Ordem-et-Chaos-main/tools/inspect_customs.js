/**
 * Check for duplicate species across sections in regional_dexes.txt,
 * and how PIKACHUX / X-form species are structured in the DB.
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');
const REPO_ROOT = join(__dirname, '..');
const DEX_FILE = join(REPO_ROOT, '../regional_dexes.txt');

const db = new Database(DB_PATH, { readonly: true });

// Find duplicates in the txt
const content = readFileSync(DEX_FILE, 'utf8');
const seen = new Map();
let section = 0;
for (const rawLine of content.split('\n')) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const m = line.match(/^\[(\d+)\]$/);
  if (m) { section = parseInt(m[1]); continue; }
  for (const id of line.split(',').map(s => s.trim()).filter(Boolean)) {
    if (seen.has(id)) console.log(`DUPLICATE: ${id} in section ${seen.get(id)} and section ${section}`);
    else seen.set(id, section);
  }
}

console.log(`\nTotal unique ids in txt: ${seen.size}`);

console.log('\n=== PIKACHUX rows in DB ===');
const pika = db.prepare(`SELECT id, form_id, name, form_name, dex_number, is_dev FROM species WHERE id LIKE 'PIKACHU%'`).all();
for (const p of pika) console.log(`  ${p.id} form=${p.form_id} name=${p.name} form_name=${p.form_name} dex=${p.dex_number} dev=${p.is_dev}`);

console.log('\n=== X-form species (ELEKIDX etc.) in DB ===');
const xforms = db.prepare(`SELECT id, form_id, name, dex_number, is_dev FROM species WHERE id IN ('ELEKIDX','ELECTABUZZX','PIKACHUX','DITTOX','SHYLEONX','TRISHOUTX','SHULONGX','GOROCHU')`).all();
for (const x of xforms) console.log(`  ${x.id} form=${x.form_id} name=${x.name} dex=${x.dex_number} dev=${x.is_dev}`);

console.log('\n=== New customs in DB ===');
const customs = db.prepare(`SELECT id, form_id, name, dex_number, is_dev, bst FROM species WHERE id IN ('CHIMAOOZE','LUXFLON','DIELEBI','TWINZ','PARA','GHIFT','SUNNEE','TRIFOX','PUDDI','DRAGALISK','GRENINJAX','MEWTWOX','RAICHUX','BISHARPX','SCOVILEX','TYRANITARX','AEGISLASHX','TAPUFINIX','TAPULELEX','TAPUKOKOX','TAPUBULUX','DRAGALISKX','SWIRLIXX','SLURPUFFX','ROSERADEX','MAREANIEX','TOXAPEXX')`).all();
console.log(`  found ${customs.length} of 27`);
for (const c of customs) console.log(`  ${c.id} form=${c.form_id} name=${c.name} dex=${c.dex_number} dev=${c.is_dev} bst=${c.bst}`);
