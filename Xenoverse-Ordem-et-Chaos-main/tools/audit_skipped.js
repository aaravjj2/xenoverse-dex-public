/**
 * Audit: find species in species.dat that the export pipeline skips as WIP,
 * and compare against the game's regional dex (which is authoritative for "real" pokemon).
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from './export/marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'Data');

// Load species.dat
const buf = readFileSync(join(DATA_DIR, 'species.dat'));
const speciesResult = decode(buf);
const speciesData = speciesResult.data;

// Build set of skipped species
const skipped = [];
if (speciesData && typeof speciesData === 'object' && !Array.isArray(speciesData)) {
  for (const [key, value] of Object.entries(speciesData)) {
    if (!value || typeof value !== 'object' || !value.__class__) continue;
    const stats = value.base_stats || {};
    const name = value.name || key;
    const hp = stats.HP ?? stats.hp ?? 0;
    const atk = stats.ATK ?? stats.ATTACK ?? stats.attack ?? 0;
    const def = stats.DEF ?? stats.DEFENSE ?? stats.defense ?? 0;
    const spa = stats.SPATK ?? stats.SPECIAL_ATTACK ?? stats.spa ?? stats.special_attack ?? 0;
    const spd = stats.SPDEF ?? stats.SPECIAL_DEFENSE ?? stats.spd ?? stats.special_defense ?? 0;
    const spe = stats.SPD ?? stats.SPEED ?? stats.speed ?? stats.spe ?? 0;
    const bst = hp + atk + def + spa + spd + spe;
    const isWip = name === 'WIP' ||
      bst === 6 ||
      (hp === 1 && atk === 1 && def === 1 && spa === 1 && spd === 1 && spe === 1);
    if (isWip) {
      skipped.push({
        key,
        name,
        bst,
        stats: { hp, atk, def, spa, spd, spe },
        types: Array.isArray(value.types) ? value.types.map(t => typeof t === 'string' ? t : t?.id || String(t)) : [],
        form: value.form || value.form_id || 0,
      });
    }
  }
}

console.log(`Skipped species count: ${skipped.length}`);
for (const s of skipped) {
  console.log(`  ${s.key} | "${s.name}" | BST=${s.bst} | types=${s.types.join('/')} | form=${s.form} | hp=${s.stats.hp} atk=${s.stats.atk} def=${s.stats.def} spa=${s.stats.spa} spd=${s.stats.spd} spe=${s.stats.spe}`);
}
