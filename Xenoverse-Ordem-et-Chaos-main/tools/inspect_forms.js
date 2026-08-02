/**
 * Inspect form ID structure in dex.db — how forms relate to base species.
 */
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');

const db = new Database(DB_PATH, { readonly: true });

console.log('=== species table columns ===');
const cols = db.prepare('PRAGMA table_info(species)').all();
for (const c of cols) console.log(`  ${c.name} ${c.type}`);

console.log('\n=== Form rows (form_id > 0), sample ===');
const forms = db.prepare('SELECT id, form_id, name FROM species WHERE form_id > 0 LIMIT 10').all();
for (const f of forms) console.log(`  id=${f.id} form_id=${f.form_id} name=${f.name}`);

console.log('\n=== All ids ending in _N (possible form pattern) ===');
const underscore = db.prepare(`SELECT id, form_id FROM species WHERE id GLOB '*_[0-9]' LIMIT 10`).all();
for (const f of underscore) console.log(`  id=${f.id} form_id=${f.form_id}`);

console.log('\n=== species column of a few base species with forms ===');
const bases = db.prepare(`SELECT DISTINCT id FROM species WHERE id GLOB '*_*' LIMIT 10`).all();
for (const b of bases) console.log(`  id=${b.id}`);

console.log('\n=== regional_dex coverage ===');
const total = db.prepare('SELECT COUNT(*) c FROM species').get().c;
const inDex = db.prepare('SELECT COUNT(*) c FROM regional_dex').get().c;
console.log(`  species rows: ${total}, regional_dex rows: ${inDex}`);

const dexOnly = db.prepare('SELECT COUNT(*) c FROM regional_dex rd LEFT JOIN species s ON rd.species_id = s.id WHERE s.id IS NULL').get().c;
console.log(`  regional_dex entries w/o matching species: ${dexOnly}`);

console.log('\n=== species NOT in regional_dex: base vs form ===');
const notInDex = db.prepare(`
  SELECT 
    SUM(CASE WHEN s.form_id = 0 THEN 1 ELSE 0 END) AS bases,
    SUM(CASE WHEN s.form_id > 0 THEN 1 ELSE 0 END) AS forms
  FROM species s LEFT JOIN regional_dex rd ON s.id = rd.species_id
  WHERE rd.species_id IS NULL
`).get();
console.log(`  bases w/o dex entry: ${notInDex.bases}, forms w/o dex entry: ${notInDex.forms}`);
