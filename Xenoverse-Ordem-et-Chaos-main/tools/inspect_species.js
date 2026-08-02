/**
 * Inspect raw species.dat entries for species the export drops as WIP.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from './export/marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'Data');

const buf = readFileSync(join(DATA_DIR, 'species.dat'));
const speciesData = decode(buf).data;

for (const key of ['CHIMAOOZE', 'GRENINJAX', 'DRAGALISK', 'BULBASAUR']) {
  const v = speciesData[key];
  console.log(`\n=== ${key} ===`);
  if (!v) { console.log('  NOT FOUND'); continue; }
  // Show all keys and their raw values (truncated)
  for (const [k2, val] of Object.entries(v)) {
    let out;
    if (typeof val === 'object') {
      out = JSON.stringify(val).slice(0, 200);
    } else {
      out = String(val).slice(0, 100);
    }
    console.log(`  ${k2}: ${out}`);
  }
}
