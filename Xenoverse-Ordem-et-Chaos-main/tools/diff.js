/**
 * Diff Engine for Xenoverse Dex
 * Produces field-level diffs and human-readable changelogs between builds
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const BUILDS_DIR = join(REPO_ROOT, 'out/builds');

/**
 * Load a build's JSON data
 */
function loadBuildData(buildId, filename) {
  const filepath = join(BUILDS_DIR, buildId, filename);
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf8'));
}

/**
 * Compare two arrays of objects by a key field
 */
function diffArrayByKey(oldArr, newArr, keyFn, entityName) {
  const oldMap = new Map(oldArr.map(item => [keyFn(item), item]));
  const newMap = new Map(newArr.map(item => [keyFn(item), item]));
  
  const added = [];
  const removed = [];
  const changed = [];
  
  // Find added and changed
  for (const [key, newItem] of newMap) {
    const oldItem = oldMap.get(key);
    if (!oldItem) {
      added.push({ key, item: newItem });
    } else {
      const changes = diffObjects(oldItem, newItem);
      if (changes.length > 0) {
        changed.push({ key, changes, oldItem, newItem });
      }
    }
  }
  
  // Find removed
  for (const [key, oldItem] of oldMap) {
    if (!newMap.has(key)) {
      removed.push({ key, item: oldItem });
    }
  }
  
  return { entityName, added, removed, changed };
}

/**
 * Diff two objects, returning list of field changes
 */
function diffObjects(oldObj, newObj, path = '') {
  const changes = [];
  
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  for (const key of allKeys) {
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];
    const currentPath = path ? `${path}.${key}` : key;
    
    if (oldVal === newVal) continue;
    
    // Handle null/undefined
    if (oldVal == null && newVal != null) {
      changes.push({ field: currentPath, type: 'added', newValue: newVal });
      continue;
    }
    if (oldVal != null && newVal == null) {
      changes.push({ field: currentPath, type: 'removed', oldValue: oldVal });
      continue;
    }
    
    // Handle arrays
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ 
          field: currentPath, 
          type: 'changed', 
          oldValue: oldVal, 
          newValue: newVal,
          delta: { added: newVal.filter(x => !oldVal.includes(x)), removed: oldVal.filter(x => !newVal.includes(x)) }
        });
      }
      continue;
    }
    
    // Handle nested objects
    if (typeof oldVal === 'object' && typeof newVal === 'object') {
      changes.push(...diffObjects(oldVal, newVal, currentPath));
      continue;
    }
    
    // Handle primitive changes
    if (oldVal !== newVal) {
      changes.push({ field: currentPath, type: 'changed', oldValue: oldVal, newValue: newVal });
    }
  }
  
  return changes;
}

/**
 * Generate diff between two builds
 */
export function generateDiff(fromBuildId, toBuildId) {
  const fromMeta = loadBuildData(fromBuildId, 'meta.json');
  const toMeta = loadBuildData(toBuildId, 'meta.json');
  
  if (!fromMeta || !toMeta) {
    throw new Error('Could not load build metadata');
  }
  
  const diff = {
    from: { id: fromBuildId, timestamp: fromMeta.timestamp },
    to: { id: toBuildId, timestamp: toMeta.timestamp },
    generated: new Date().toISOString(),
    summary: {},
    entities: {},
    breaking: []
  };
  
  // Compare species
  const fromSpecies = loadBuildData(fromBuildId, 'species.json');
  const toSpecies = loadBuildData(toBuildId, 'species.json');
  
  if (fromSpecies && toSpecies) {
    const speciesDiff = diffArrayByKey(
      fromSpecies.data || [],
      toSpecies.data || [],
      s => `${s.id || s.species}_${s.formId || 0}`,
      'species'
    );
    diff.entities.species = speciesDiff;
    diff.summary.species = {
      added: speciesDiff.added.length,
      removed: speciesDiff.removed.length,
      changed: speciesDiff.changed.length
    };
    
    // Check for breaking changes
    if (speciesDiff.removed.length > 0) {
      diff.breaking.push({
        type: 'species_removed',
        count: speciesDiff.removed.length,
        items: speciesDiff.removed.slice(0, 10).map(r => r.key)
      });
    }
  }
  
  // Compare moves
  const fromMoves = loadBuildData(fromBuildId, 'moves.json');
  const toMoves = loadBuildData(toBuildId, 'moves.json');
  
  if (fromMoves && toMoves) {
    const movesDiff = diffArrayByKey(
      fromMoves.data || [],
      toMoves.data || [],
      m => m.id,
      'moves'
    );
    diff.entities.moves = movesDiff;
    diff.summary.moves = {
      added: movesDiff.added.length,
      removed: movesDiff.removed.length,
      changed: movesDiff.changed.length
    };
  }
  
  // Compare evolutions
  const fromEvos = loadBuildData(fromBuildId, 'evolutions.json');
  const toEvos = loadBuildData(toBuildId, 'evolutions.json');
  
  if (fromEvos && toEvos) {
    const evosDiff = diffArrayByKey(
      fromEvos.data || [],
      toEvos.data || [],
      e => `${e.species}_${e.formId || 0}_${e.target}`,
      'evolutions'
    );
    diff.entities.evolutions = evosDiff;
    diff.summary.evolutions = {
      added: evosDiff.added.length,
      removed: evosDiff.removed.length,
      changed: evosDiff.changed.length
    };
  }
  
  // Compare counts
  diff.summary.counts = {
    from: fromMeta.counts,
    to: toMeta.counts,
    delta: {}
  };
  
  for (const key of Object.keys(toMeta.counts || {})) {
    const fromCount = fromMeta.counts?.[key] || 0;
    const toCount = toMeta.counts?.[key] || 0;
    if (fromCount !== toCount) {
      diff.summary.counts.delta[key] = toCount - fromCount;
    }
  }
  
  return diff;
}

/**
 * Generate markdown changelog from diff
 */
export function generateChangelog(diff) {
  const lines = [];
  
  lines.push('# Changelog');
  lines.push('');
  lines.push(`**From:** ${diff.from.id} (${diff.from.timestamp})`);
  lines.push(`**To:** ${diff.to.id} (${diff.to.timestamp})`);
  lines.push(`**Generated:** ${diff.generated}`);
  lines.push('');
  
  // Breaking changes
  if (diff.breaking.length > 0) {
    lines.push('## ⚠️ Breaking Changes');
    lines.push('');
    for (const b of diff.breaking) {
      lines.push(`- **${b.type}**: ${b.count} items`);
      if (b.items) {
        for (const item of b.items.slice(0, 5)) {
          lines.push(`  - ${item}`);
        }
        if (b.items.length > 5) {
          lines.push(`  - ... and ${b.items.length - 5} more`);
        }
      }
    }
    lines.push('');
  }
  
  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Entity | Added | Removed | Changed |');
  lines.push('|--------|-------|---------|---------|');
  
  for (const [entity, summary] of Object.entries(diff.summary)) {
    if (entity === 'counts') continue;
    if (typeof summary === 'object' && 'added' in summary) {
      lines.push(`| ${entity} | ${summary.added} | ${summary.removed} | ${summary.changed} |`);
    }
  }
  lines.push('');
  
  // Count changes
  if (Object.keys(diff.summary.counts?.delta || {}).length > 0) {
    lines.push('### Count Changes');
    lines.push('');
    for (const [key, delta] of Object.entries(diff.summary.counts.delta)) {
      const sign = delta > 0 ? '+' : '';
      lines.push(`- ${key}: ${sign}${delta}`);
    }
    lines.push('');
  }
  
  // Detailed changes
  for (const [entityName, entityDiff] of Object.entries(diff.entities)) {
    if (!entityDiff) continue;
    
    const { added, removed, changed } = entityDiff;
    const total = added.length + removed.length + changed.length;
    if (total === 0) continue;
    
    lines.push(`## ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}`);
    lines.push('');
    
    if (added.length > 0) {
      lines.push(`### Added (${added.length})`);
      lines.push('');
      for (const { key, item } of added.slice(0, 20)) {
        const name = item.name || item.id || key;
        lines.push(`- **${name}**`);
      }
      if (added.length > 20) {
        lines.push(`- ... and ${added.length - 20} more`);
      }
      lines.push('');
    }
    
    if (removed.length > 0) {
      lines.push(`### Removed (${removed.length})`);
      lines.push('');
      for (const { key, item } of removed.slice(0, 20)) {
        const name = item.name || item.id || key;
        lines.push(`- ~~${name}~~`);
      }
      if (removed.length > 20) {
        lines.push(`- ... and ${removed.length - 20} more`);
      }
      lines.push('');
    }
    
    if (changed.length > 0) {
      lines.push(`### Changed (${changed.length})`);
      lines.push('');
      for (const { key, changes } of changed.slice(0, 20)) {
        lines.push(`- **${key}**:`);
        for (const change of changes.slice(0, 5)) {
          if (change.type === 'changed') {
            lines.push(`  - ${change.field}: \`${JSON.stringify(change.oldValue)}\` → \`${JSON.stringify(change.newValue)}\``);
          } else {
            lines.push(`  - ${change.field}: ${change.type}`);
          }
        }
        if (changes.length > 5) {
          lines.push(`  - ... and ${changes.length - 5} more changes`);
        }
      }
      if (changed.length > 20) {
        lines.push(`- ... and ${changed.length - 20} more items`);
      }
      lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * CLI entry point
 */
export function runDiff(fromBuildId, toBuildId, outputDir) {
  console.log(`Generating diff: ${fromBuildId} → ${toBuildId}`);
  
  const diff = generateDiff(fromBuildId, toBuildId);
  const changelog = generateChangelog(diff);
  
  // Write outputs
  const diffPath = join(outputDir || BUILDS_DIR, `diff_${fromBuildId}_${toBuildId}.json`);
  const changelogPath = join(outputDir || BUILDS_DIR, `changelog_${fromBuildId}_${toBuildId}.md`);
  
  writeFileSync(diffPath, JSON.stringify(diff, null, 2));
  writeFileSync(changelogPath, changelog);
  
  console.log(`Diff written to: ${diffPath}`);
  console.log(`Changelog written to: ${changelogPath}`);
  
  return { diff, changelog, diffPath, changelogPath };
}

export default {
  generateDiff,
  generateChangelog,
  runDiff,
  diffObjects,
  diffArrayByKey
};
