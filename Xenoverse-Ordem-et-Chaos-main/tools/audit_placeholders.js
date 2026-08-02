/**
 * Count all species keys in species.dat and list those the export would skip,
 * plus those with placeholder names but real sprites.
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

const keys = Object.keys(speciesData).filter(k => speciesData[k] && speciesData[k].__class__);
console.log(`Total species entries in species.dat: ${keys.length}`);

// Find entries whose real_name contains a placeholder
const placeholder = /WIP|TEST|PLACEHOLDER|TODO|TEMP|\?\?\?/i;
const flagged = keys.filter(k => {
  const v = speciesData[k];
  const name = v.real_name || v.name || '';
  return placeholder.test(name);
});
console.log(`Entries with placeholder real_name: ${flagged.length}`);
for (const k of flagged) {
  const v = speciesData[k];
  console.log(`  ${k} -> real_name="${v.real_name}" name="${v.name}" types=${JSON.stringify(v.types)}`);
}
