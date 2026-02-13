#!/usr/bin/env node
/**
 * Fix Regional Form Names
 * Updates form_name for known regional variants (Hisuian, Galarian, Alolan, Paldean)
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, '../out/dex.db'));

// Known regional variant mappings
// Format: [BaseSpecies, FormId, RegionalName]
const REGIONAL_VARIANTS = [
    // Hisuian Forms
    ['GROWLITHE', 1, 'Hisuian'],
    ['ARCANINE', 1, 'Hisuian'],
    ['VOLTORB', 1, 'Hisuian'],
    ['ELECTRODE', 1, 'Hisuian'],
    ['TYPHLOSION', 1, 'Hisuian'],
    ['QWILFISH', 1, 'Hisuian'],
    ['SNEASEL', 1, 'Hisuian'],
    ['SAMUROTT', 1, 'Hisuian'],
    ['LILLIGANT', 1, 'Hisuian'],
    ['ZORUA', 1, 'Hisuian'],
    ['ZOROARK', 1, 'Hisuian'],
    ['BRAVIARY', 1, 'Hisuian'],
    ['SLIGGOO', 1, 'Hisuian'],
    ['GOODRA', 1, 'Hisuian'],
    ['AVALUGG', 1, 'Hisuian'],
    ['DECIDUEYE', 1, 'Hisuian'],
    ['DIALGA', 1, 'Origin'],
    ['PALKIA', 1, 'Origin'],

    // Galarian Forms
    ['MEOWTH', 1, 'Galarian'],
    ['PONYTA', 1, 'Galarian'],
    ['RAPIDASH', 1, 'Galarian'],
    ['SLOWPOKE', 1, 'Galarian'],
    ['SLOWBRO', 1, 'Galarian'],
    ['FARFETCHD', 1, 'Galarian'],
    ['WEEZING', 1, 'Galarian'],
    ['MR_MIME', 1, 'Galarian'],
    ['ARTICUNO', 1, 'Galarian'],
    ['ZAPDOS', 1, 'Galarian'],
    ['MOLTRES', 1, 'Galarian'],
    ['SLOWKING', 1, 'Galarian'],
    ['CORSOLA', 1, 'Galarian'],
    ['ZIGZAGOON', 1, 'Galarian'],
    ['LINOONE', 1, 'Galarian'],
    ['DARUMAKA', 1, 'Galarian'],
    ['DARMANITAN', 1, 'Galarian'],
    ['YAMASK', 1, 'Galarian'],
    ['STUNFISK', 1, 'Galarian'],

    // Alolan Forms
    ['RATTATA', 1, 'Alolan'],
    ['RATICATE', 1, 'Alolan'],
    ['RAICHU', 1, 'Alolan'],
    ['SANDSHREW', 1, 'Alolan'],
    ['SANDSLASH', 1, 'Alolan'],
    ['VULPIX', 1, 'Alolan'],
    ['NINETALES', 1, 'Alolan'],
    ['DIGLETT', 1, 'Alolan'],
    ['DUGTRIO', 1, 'Alolan'],
    ['MEOWTH', 2, 'Alolan'],
    ['PERSIAN', 1, 'Alolan'],
    ['GEODUDE', 1, 'Alolan'],
    ['GRAVELER', 1, 'Alolan'],
    ['GOLEM', 1, 'Alolan'],
    ['GRIMER', 1, 'Alolan'],
    ['MUK', 1, 'Alolan'],
    ['EXEGGUTOR', 1, 'Alolan'],
    ['MAROWAK', 1, 'Alolan'],

    // Paldean Forms
    ['TAUROS', 1, 'Paldean Combat'],
    ['TAUROS', 2, 'Paldean Blaze'],
    ['TAUROS', 3, 'Paldean Aqua'],
    ['WOOPER', 1, 'Paldean'],
];

const update = db.prepare('UPDATE species SET form_name = ? WHERE id = ?');

let count = 0;
for (const [base, formId, region] of REGIONAL_VARIANTS) {
    // Build ID based on common patterns
    const suffixedId = `${base}_${formId}`;

    // Check if exists
    const row = db.prepare('SELECT id, form_name FROM species WHERE id = ?').get(suffixedId);
    if (row && !row.form_name) {
        update.run(region, suffixedId);
        console.log(`Updated [${suffixedId}] -> "${region}"`);
        count++;
    }
}

console.log(`\nUpdated ${count} regional form names.`);
db.close();
