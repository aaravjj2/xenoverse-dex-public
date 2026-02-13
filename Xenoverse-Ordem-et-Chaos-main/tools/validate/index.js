#!/usr/bin/env node

/**
 * Validation Engine for Xenoverse Dex
 * 
 * Canonical (Layer A): ERROR-level - fails build
 * Derived (Layer B): WARNING-level - does not fail build
 */

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../out/dex.db');
const OUT_DIR = join(__dirname, '../../out/builds/latest');

/**
 * Validate canonical data integrity (ERROR-level)
 */
function validateCanonical(db) {
    const issues = [];

    // 1. Trainer party species must exist
    const invalidSpecies = db.prepare(`
    SELECT tp.trainer_id, tp.slot, tp.species_id 
    FROM trainer_party tp
    LEFT JOIN species s ON s.id = tp.species_id
    WHERE s.id IS NULL
  `).all();

    for (const row of invalidSpecies) {
        issues.push({
            level: 'ERROR',
            layer: 'canonical',
            entity: `trainer_party:${row.trainer_id}:${row.slot}`,
            field: 'species_id',
            message: `Invalid species reference: ${row.species_id}`,
            details: row
        });
    }

    // 2. Trainer party moves must exist (if present)
    const partyWithMoves = db.prepare(`
    SELECT trainer_id, slot, moves FROM trainer_party WHERE moves IS NOT NULL AND moves != '[]'
  `).all();

    for (const row of partyWithMoves) {
        const moves = JSON.parse(row.moves || '[]');
        for (const move of moves) {
            const exists = db.prepare('SELECT 1 FROM moves WHERE id = ?').get(move);
            if (!exists) {
                issues.push({
                    level: 'ERROR',
                    layer: 'canonical',
                    entity: `trainer_party:${row.trainer_id}:${row.slot}`,
                    field: 'moves',
                    message: `Invalid move reference: ${move}`,
                    details: { trainerId: row.trainer_id, slot: row.slot, move }
                });
            }
        }
    }

    // 3. Trainer party items must exist (if present)
    const partyWithItems = db.prepare(`
    SELECT trainer_id, slot, item FROM trainer_party WHERE item IS NOT NULL
  `).all();

    for (const row of partyWithItems) {
        const exists = db.prepare('SELECT 1 FROM items WHERE id = ?').get(row.item);
        if (!exists) {
            issues.push({
                level: 'ERROR',
                layer: 'canonical',
                entity: `trainer_party:${row.trainer_id}:${row.slot}`,
                field: 'item',
                message: `Invalid item reference: ${row.item}`,
                details: row
            });
        }
    }

    // 4. Check for duplicate item IDs
    const duplicateItems = db.prepare(`
    SELECT id, COUNT(*) as count FROM items GROUP BY id HAVING count > 1
  `).all();

    for (const row of duplicateItems) {
        issues.push({
            level: 'ERROR',
            layer: 'canonical',
            entity: `items:${row.id}`,
            field: 'id',
            message: `Duplicate item ID found (${row.count} occurrences)`,
            details: row
        });
    }

    return issues;
}

/**
 * Validate derived data integrity (WARNING-level)
 */
function validateDerived(db) {
    const issues = [];

    // 1. World facts with item references should resolve
    const itemFacts = db.prepare(`
    SELECT id, type, payload FROM world_facts 
    WHERE type IN ('item_location', 'hidden_item')
  `).all();

    for (const row of itemFacts) {
        const payload = JSON.parse(row.payload || '{}');
        if (payload.itemId) {
            const exists = db.prepare('SELECT 1 FROM items WHERE id = ?').get(payload.itemId);
            if (!exists) {
                issues.push({
                    level: 'WARNING',
                    layer: 'derived',
                    entity: `world_facts:${row.id}`,
                    field: 'payload.itemId',
                    message: `Item reference not found in canonical: ${payload.itemId}`,
                    details: { factId: row.id, itemId: payload.itemId }
                });
            }
        }
    }

    // 2. World facts with trainer references should resolve
    const trainerFacts = db.prepare(`
    SELECT id, type, payload FROM world_facts 
    WHERE type = 'trainer_location'
  `).all();

    for (const row of trainerFacts) {
        const payload = JSON.parse(row.payload || '{}');
        if (payload.trainerId) {
            const exists = db.prepare('SELECT 1 FROM trainers WHERE id = ?').get(payload.trainerId);
            if (!exists) {
                issues.push({
                    level: 'WARNING',
                    layer: 'derived',
                    entity: `world_facts:${row.id}`,
                    field: 'payload.trainerId',
                    message: `Trainer reference not found in canonical: ${payload.trainerId}`,
                    details: { factId: row.id, trainerId: payload.trainerId }
                });
            }
        }
    }

    // 3. Provenance fields should be non-null
    const nullProvenance = db.prepare(`
    SELECT id, type, map_id, event_id FROM world_facts 
    WHERE map_id IS NULL
  `).all();

    for (const row of nullProvenance) {
        issues.push({
            level: 'WARNING',
            layer: 'derived',
            entity: `world_facts:${row.id}`,
            field: 'map_id',
            message: 'Missing provenance: map_id is null',
            details: row
        });
    }

    return issues;
}

/**
 * Get extraction coverage statistics
 */
function getCoverage(db) {
    const factsByType = db.prepare(`
    SELECT type, COUNT(*) as count FROM world_facts GROUP BY type
  `).all();

    const uniqueMaps = db.prepare(`
    SELECT COUNT(DISTINCT map_id) as count FROM world_facts
  `).get();

    const uniqueEvents = db.prepare(`
    SELECT COUNT(DISTINCT map_id || '-' || event_id) as count FROM world_facts
  `).get();

    const typeMap = {};
    for (const row of factsByType) {
        typeMap[row.type] = row.count;
    }

    return {
        mapsScanned: uniqueMaps?.count || 0,
        eventsScanned: uniqueEvents?.count || 0,
        factsByType: typeMap
    };
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(report) {
    let md = `# Validation Report

**Generated**: ${report.timestamp}  
**Version**: ${report.version}

## Summary

| Metric | Count |
|--------|-------|
| Canonical Errors | ${report.summary.canonicalErrors} |
| Derived Warnings | ${report.summary.derivedWarnings} |
| **Valid Build** | ${report.summary.valid ? '✅ YES' : '❌ NO'} |

## Coverage

| Metric | Count |
|--------|-------|
| Maps with facts | ${report.coverage.mapsScanned} |
| Unique events | ${report.coverage.eventsScanned} |

### Facts by Type

| Type | Count |
|------|-------|
`;

    for (const [type, count] of Object.entries(report.coverage.factsByType)) {
        md += `| ${type} | ${count} |\n`;
    }

    if (report.issues.length > 0) {
        md += `\n## Issues (${report.issues.length} total)\n\n`;

        const errors = report.issues.filter(i => i.level === 'ERROR');
        const warnings = report.issues.filter(i => i.level === 'WARNING');

        if (errors.length > 0) {
            md += `### Errors (${errors.length})\n\n`;
            for (const issue of errors.slice(0, 20)) {
                md += `- **${issue.entity}** (${issue.field}): ${issue.message}\n`;
            }
            if (errors.length > 20) {
                md += `\n*...and ${errors.length - 20} more errors*\n`;
            }
        }

        if (warnings.length > 0) {
            md += `\n### Warnings (${warnings.length})\n\n`;
            for (const issue of warnings.slice(0, 20)) {
                md += `- **${issue.entity}** (${issue.field}): ${issue.message}\n`;
            }
            if (warnings.length > 20) {
                md += `\n*...and ${warnings.length - 20} more warnings*\n`;
            }
        }
    } else {
        md += '\n## Issues\n\nNo issues found! 🎉\n';
    }

    return md;
}

/**
 * Run validation
 */
function validate() {
    console.log('Running validation...\n');

    const db = new Database(DB_PATH, { readonly: true });

    const canonicalIssues = validateCanonical(db);
    const derivedIssues = validateDerived(db);
    const allIssues = [...canonicalIssues, ...derivedIssues];
    const coverage = getCoverage(db);

    const canonicalErrors = canonicalIssues.filter(i => i.level === 'ERROR').length;
    const derivedWarnings = derivedIssues.filter(i => i.level === 'WARNING').length;

    const report = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        summary: {
            canonicalErrors,
            derivedWarnings,
            valid: canonicalErrors === 0
        },
        issues: allIssues,
        coverage
    };

    // Ensure output directory exists
    if (!existsSync(OUT_DIR)) {
        mkdirSync(OUT_DIR, { recursive: true });
    }

    // Write JSON report
    writeFileSync(
        join(OUT_DIR, 'validation_report.json'),
        JSON.stringify(report, null, 2)
    );

    // Write Markdown report
    const md = generateMarkdownReport(report);
    writeFileSync(join(OUT_DIR, 'validation_report.md'), md);

    // Console output
    console.log('Validation Summary');
    console.log('==================');
    console.log(`Canonical Errors: ${report.summary.canonicalErrors}`);
    console.log(`Derived Warnings: ${report.summary.derivedWarnings}`);
    console.log(`Valid Build: ${report.summary.valid ? 'YES' : 'NO'}`);
    console.log('');
    console.log('Coverage:');
    console.log(`  Maps with facts: ${report.coverage.mapsScanned}`);
    console.log(`  Unique events: ${report.coverage.eventsScanned}`);
    console.log('  Facts by type:');
    for (const [type, count] of Object.entries(report.coverage.factsByType)) {
        console.log(`    ${type}: ${count}`);
    }

    if (report.issues.length > 0) {
        console.log('\nTop Issues:');
        for (const issue of report.issues.slice(0, 10)) {
            console.log(`  [${issue.level}] ${issue.entity}: ${issue.message}`);
        }
    }

    console.log(`\nReports written to: ${OUT_DIR}`);

    db.close();

    // Exit with error if canonical validation fails
    if (!report.summary.valid) {
        console.error('\n❌ Build failed: canonical validation errors found');
        process.exit(1);
    }

    console.log('\n✅ Validation passed');
    return report;
}

// Run
validate();
