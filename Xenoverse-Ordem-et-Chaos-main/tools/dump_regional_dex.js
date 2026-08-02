/**
 * Dump the game's regional dexes from regional_dexes.dat (authoritative in-game pokedex)
 * Regenerates ../regional_dexes.txt in the game's own dex order.
 * Uses the project's own marshal decoder.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from './export/marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'Data');
const OUT_TXT = join(REPO_ROOT, '../regional_dexes.txt');

const buffer = readFileSync(join(DATA_DIR, 'regional_dexes.dat'));
const result = decode(buffer);

console.log('Decoded regional_dexes.dat');
console.log('Top-level type:', result.format?.format || typeof result.data);

const lines = ['# See the documentation on the wiki to learn how to edit this file.', '#-------------------------------'];
let total = 0;

if (Array.isArray(result.data)) {
  console.log(`Total dexes: ${result.data.length}`);
  for (let dexIdx = 0; dexIdx < result.data.length; dexIdx++) {
    const dex = result.data[dexIdx];
    if (!Array.isArray(dex)) {
      console.log(`  Dex ${dexIdx}: not an array (${typeof dex}), skipping`);
      continue;
    }
    // Group consecutive entries into comma-lines of 3 (like the original txt format)
    lines.push(`[${dexIdx}]`);
    let chunk = [];
    const flush = () => {
      if (chunk.length) {
        lines.push(chunk.join(','));
        chunk = [];
      }
    };
    for (let i = 0; i < dex.length; i++) {
      const species = typeof dex[i] === 'string' ? dex[i] : dex[i]?.toString();
      if (species && species.length > 0) {
        chunk.push(species);
        total++;
        if (chunk.length === 3) flush();
      }
    }
    flush();
    lines.push('#-------------------------------');
    console.log(`  Dex ${dexIdx}: ${dex.length} entries (${chunk.length ? 'unflushed' : 'written'})`);
  }
} else if (typeof result.data === 'object') {
  console.log('Hash-format dex (keys):', Object.keys(result.data).join(', '));
  for (const [key, dex] of Object.entries(result.data)) {
    if (!Array.isArray(dex)) continue;
    lines.push(`[${key}]`);
    let chunk = [];
    const flush = () => {
      if (chunk.length) {
        lines.push(chunk.join(','));
        chunk = [];
      }
    };
    for (let i = 0; i < dex.length; i++) {
      const species = typeof dex[i] === 'string' ? dex[i] : dex[i]?.toString();
      if (species && species.length > 0) {
        chunk.push(species);
        total++;
        if (chunk.length === 3) flush();
      }
    }
    flush();
    lines.push('#-------------------------------');
    console.log(`  Dex ${key}: ${dex.length} entries`);
  }
} else {
  console.error('Unexpected data shape:', typeof result.data);
  process.exit(1);
}

writeFileSync(OUT_TXT, lines.join('\n') + '\n');
console.log(`\nWrote ${OUT_TXT} with ${total} total species entries.`);
