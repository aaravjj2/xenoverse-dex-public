/**
 * Audit: species with low BST or all-1 stats that have NON-placeholder names.
 * Determines if the export/ingest stat-based filters catch real content.
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

const placeholder = /WIP|TEST|PLACEHOLDER|TODO|TEMP|\?\?\?/i;
let lowBstReal = [];
let allOne = [];

for (const [key, v] of Object.entries(speciesData)) {
  if (!v || typeof v !== 'object' || !v.__class__) continue;
  const name = v.real_name || v.name || key;
  const stats = v.base_stats || {};
  const hp = stats.HP ?? stats.hp ?? 0;
  const atk = stats.ATK ?? stats.ATTACK ?? stats.attack ?? 0;
  const def = stats.DEF ?? stats.DEFENSE ?? stats.defense ?? 0;
  const spa = stats.SPATK ?? stats.SPECIAL_ATTACK ?? stats.spa ?? stats.special_attack ?? 0;
  const spd = stats.SPDEF ?? stats.SPECIAL_DEFENSE ?? stats.spd ?? stats.special_defense ?? 0;
  const spe = stats.SPD ?? stats.SPEED ?? stats.speed ?? stats.spe ?? 0;
  const bst = hp + atk + def + spa + spd + spe;
  const isPlaceholderName = placeholder.test(name);

  if (!isPlaceholderName && bst > 0 && bst <= 60) {
    lowBstReal.push({ key, name, bst });
  }
  if (!isPlaceholderName && hp === 1 && atk === 1 && def === 1 && spa === 1 && spd === 1 && spe === 1) {
    allOne.push({ key, name });
  }
}

console.log(`Non-placeholder species with BST <= 60: ${lowBstReal.length}`);
for (const s of lowBstReal.slice(0, 25)) console.log(`  ${s.key} -> "${s.name}" BST=${s.bst}`);
if (lowBstReal.length > 25) console.log(`  ... (${lowBstReal.length - 25} more)`);
console.log(`Non-placeholder species with all-1 stats: ${allOne.length}`);
for (const s of allOne) console.log(`  ${s.key} -> "${s.name}"`);
