#!/usr/bin/env node

/**
 * Diff Engine for Xenoverse Dex
 * 
 * Compares two builds and generates diff.json + changelog.md
 */

import Database from 'better-sqlite3';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get items from database
 */
function getItems(db) {
    return db.prepare(`
    SELECT id, name, description, pocket, price, sell_price, flags
    FROM items ORDER BY id
  `).all();
}

/**
 * Get trainers from database
 */
function getTrainers(db) {
    return db.prepare(`
    SELECT id, trainer_type, name, version, party_count
    FROM trainers ORDER BY id
  `).all();
}

/**
 * Get trainer party from database
 */
function getTrainerParty(db) {
    return db.prepare(`
    SELECT trainer_id, slot, species_id, level, moves, item
    FROM trainer_party ORDER BY trainer_id, slot
  `).all();
}

/**
 * Get world facts from database
 */
function getWorldFacts(db) {
    return db.prepare(`
    SELECT id, type, map_id, event_id, page_index, command_index, payload, confidence
    FROM world_facts ORDER BY map_id, event_id, page_index, command_index
  `).all();
}

/**
 * Compare two arrays of objects by ID
 */
function diffById(oldItems, newItems, keyField = 'id') {
    const oldMap = new Map(oldItems.map(i => [i[keyField], i]));
    const newMap = new Map(newItems.map(i => [i[keyField], i]));

    const added = [];
    const removed = [];
    const changed = [];

    // Find added and changed
    for (const [id, newItem] of newMap) {
        if (!oldMap.has(id)) {
            added.push(newItem);
        } else {
            const oldItem = oldMap.get(id);
            const changes = findChanges(oldItem, newItem);
            if (changes.length > 0) {
                changed.push({ id, changes, old: oldItem, new: newItem });
            }
        }
    }

    // Find removed
    for (const [id, oldItem] of oldMap) {
        if (!newMap.has(id)) {
            removed.push(oldItem);
        }
    }

    return { added, removed, changed };
}

/**
 * Find field-level changes between two objects
 */
function findChanges(oldObj, newObj) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
        const oldVal = JSON.stringify(oldObj[key]);
        const newVal = JSON.stringify(newObj[key]);
        if (oldVal !== newVal) {
            changes.push({
                field: key,
                from: oldObj[key],
                to: newObj[key]
            });
        }
    }

    return changes;
}

/**
 * Generate changelog markdown
 */
function generateChangelog(diff) {
    let md = `# Changelog

**Generated**: ${new Date().toISOString()}

## Summary

| Entity | Added | Removed | Changed |
|--------|-------|---------|---------|
| Items | ${diff.items.added.length} | ${diff.items.removed.length} | ${diff.items.changed.length} |
| Trainers | ${diff.trainers.added.length} | ${diff.trainers.removed.length} | ${diff.trainers.changed.length} |
| World Facts | ${diff.worldFacts.added.length} | ${diff.worldFacts.removed.length} | ${diff.worldFacts.changed.length} |

`;

    // Breaking changes section
    const breakingChanges = [];

    if (diff.items.removed.length > 0) {
        breakingChanges.push(`${diff.items.removed.length} items removed`);
    }
    if (diff.trainers.removed.length > 0) {
        breakingChanges.push(`${diff.trainers.removed.length} trainers removed`);
    }

    if (breakingChanges.length > 0) {
        md += `## ⚠️ Breaking Changes

${breakingChanges.map(c => `- ${c}`).join('\n')}

`;
    }

    // Items section
    if (diff.items.added.length > 0 || diff.items.removed.length > 0 || diff.items.changed.length > 0) {
        md += `## Items

`;
        if (diff.items.added.length > 0) {
            md += `### Added (${diff.items.added.length})\n\n`;
            for (const item of diff.items.added.slice(0, 20)) {
                md += `- **${item.id}**: ${item.name}\n`;
            }
            if (diff.items.added.length > 20) {
                md += `\n*...and ${diff.items.added.length - 20} more*\n`;
            }
            md += '\n';
        }
        if (diff.items.removed.length > 0) {
            md += `### Removed (${diff.items.removed.length})\n\n`;
            for (const item of diff.items.removed.slice(0, 20)) {
                md += `- **${item.id}**: ${item.name}\n`;
            }
            md += '\n';
        }
        if (diff.items.changed.length > 0) {
            md += `### Changed (${diff.items.changed.length})\n\n`;
            for (const item of diff.items.changed.slice(0, 10)) {
                md += `- **${item.id}**: ${item.changes.map(c => c.field).join(', ')}\n`;
            }
            md += '\n';
        }
    }

    // Trainers section
    if (diff.trainers.added.length > 0 || diff.trainers.removed.length > 0 || diff.trainers.changed.length > 0) {
        md += `## Trainers

`;
        if (diff.trainers.added.length > 0) {
            md += `### Added (${diff.trainers.added.length})\n\n`;
            for (const t of diff.trainers.added.slice(0, 20)) {
                md += `- **${t.id}**: ${t.trainer_type} ${t.name}\n`;
            }
            md += '\n';
        }
        if (diff.trainers.removed.length > 0) {
            md += `### Removed (${diff.trainers.removed.length})\n\n`;
            for (const t of diff.trainers.removed.slice(0, 20)) {
                md += `- **${t.id}**: ${t.trainer_type} ${t.name}\n`;
            }
            md += '\n';
        }
        if (diff.trainers.changed.length > 0) {
            md += `### Changed (${diff.trainers.changed.length})\n\n`;
            for (const t of diff.trainers.changed.slice(0, 10)) {
                md += `- **${t.id}**: ${t.changes.map(c => c.field).join(', ')}\n`;
            }
            md += '\n';
        }
    }

    // World Facts section
    if (diff.worldFacts.added.length > 0 || diff.worldFacts.removed.length > 0) {
        md += `## World Facts

`;
        if (diff.worldFacts.added.length > 0) {
            md += `### Added (${diff.worldFacts.added.length})\n\n`;
            md += `New facts extracted from map events.\n\n`;
        }
        if (diff.worldFacts.removed.length > 0) {
            md += `### Removed (${diff.worldFacts.removed.length})\n\n`;
            md += `Facts no longer present in extraction.\n\n`;
        }
    }

    return md;
}

/**
 * Run diff between two databases
 */
export function runDiff(oldDbPath, newDbPath, outDir) {
    console.log('Running diff...');
    console.log(`  Old: ${oldDbPath}`);
    console.log(`  New: ${newDbPath}`);

    if (!existsSync(oldDbPath)) {
        console.error(`Old database not found: ${oldDbPath}`);
        process.exit(1);
    }
    if (!existsSync(newDbPath)) {
        console.error(`New database not found: ${newDbPath}`);
        process.exit(1);
    }

    const oldDb = new Database(oldDbPath, { readonly: true });
    const newDb = new Database(newDbPath, { readonly: true });

    const diff = {
        timestamp: new Date().toISOString(),
        items: diffById(getItems(oldDb), getItems(newDb)),
        trainers: diffById(getTrainers(oldDb), getTrainers(newDb)),
        worldFacts: diffById(getWorldFacts(oldDb), getWorldFacts(newDb))
    };

    oldDb.close();
    newDb.close();

    // Ensure output directory
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
    }

    // Write diff.json
    writeFileSync(join(outDir, 'diff.json'), JSON.stringify(diff, null, 2));

    // Write changelog.md
    const changelog = generateChangelog(diff);
    writeFileSync(join(outDir, 'changelog.md'), changelog);

    // Summary
    console.log('\nDiff Summary:');
    console.log(`  Items:       +${diff.items.added.length} / -${diff.items.removed.length} / ~${diff.items.changed.length}`);
    console.log(`  Trainers:    +${diff.trainers.added.length} / -${diff.trainers.removed.length} / ~${diff.trainers.changed.length}`);
    console.log(`  World Facts: +${diff.worldFacts.added.length} / -${diff.worldFacts.removed.length} / ~${diff.worldFacts.changed.length}`);
    console.log(`\nOutput: ${outDir}`);

    return diff;
}

// CLI entry point
const args = process.argv.slice(2);
if (args.length >= 2) {
    const oldDb = args[0];
    const newDb = args[1];
    const outDir = args[2] || join(__dirname, '../../out/diff');
    runDiff(oldDb, newDb, outDir);
} else {
    console.log('Usage: node diff.js <old-db> <new-db> [output-dir]');
    console.log('Example: node diff.js out/dex.v1.db out/dex.db out/diff');
}
