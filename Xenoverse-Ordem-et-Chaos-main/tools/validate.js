/**
 * Validation Suite for Xenoverse Dex
 * Runs integrity checks with severity levels
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const BUILDS_DIR = join(REPO_ROOT, 'out/builds');

// Severity levels
const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * Validation issue
 */
class Issue {
  constructor(code, message, entity, severity = SEVERITY.WARNING, suggestion = null) {
    this.code = code;
    this.message = message;
    this.entity = entity;
    this.severity = severity;
    this.suggestion = suggestion;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Load build data
 */
function loadBuildData(buildDir, filename) {
  const filepath = join(buildDir, filename);
  if (!existsSync(filepath)) return null;
  return JSON.parse(readFileSync(filepath, 'utf8'));
}

/**
 * Validate species referential integrity
 */
function validateSpeciesIntegrity(species, types, abilities) {
  const issues = [];
  const typeSet = new Set(types.map(t => t.id || t.name || t));
  const abilitySet = new Set(abilities.map(a => a.id || a.name || a));
  const speciesSet = new Set(species.map(s => s.id || s.species));

  for (const sp of species) {
    const id = sp.id || sp.species;

    // Validate types
    for (const type of sp.types || []) {
      if (!typeSet.has(type) && !typeSet.has(type?.toUpperCase())) {
        issues.push(new Issue(
          'INVALID_TYPE_REF',
          `Species ${id} references unknown type: ${type}`,
          { species: id, type },
          SEVERITY.WARNING,
          'Check if type exists in types.json'
        ));
      }
    }

    // Validate abilities
    const allAbilities = [
      ...(sp.abilities?.normal || []),
      ...(sp.abilities?.hidden || [])
    ];
    for (const ability of allAbilities) {
      if (ability && !abilitySet.has(ability) && !abilitySet.has(ability?.toUpperCase())) {
        issues.push(new Issue(
          'INVALID_ABILITY_REF',
          `Species ${id} references unknown ability: ${ability}`,
          { species: id, ability },
          SEVERITY.WARNING,
          'Check if ability exists in abilities.json'
        ));
      }
    }

    // Validate evolution targets
    for (const evo of sp.evolutions || []) {
      const target = evo.target || evo.species;
      if (target && !speciesSet.has(target)) {
        issues.push(new Issue(
          'INVALID_EVOLUTION_TARGET',
          `Species ${id} evolves to unknown species: ${target}`,
          { species: id, target },
          SEVERITY.ERROR,
          'Check if target species exists in species.json'
        ));
      }
    }
  }

  return issues;
}

/**
 * Validate stat sanity
 */
function validateStatSanity(species, config = {}) {
  const issues = [];
  const {
    minStat = 1,
    maxStat = 255,
    minBst = 100,
    maxBst = 800
  } = config;

  for (const sp of species) {
    const id = sp.id || sp.species;
    const stats = sp.stats || {};

    // Check individual stats
    for (const [statName, value] of Object.entries(stats)) {
      if (typeof value !== 'number') continue;

      if (value < minStat) {
        issues.push(new Issue(
          'STAT_TOO_LOW',
          `Species ${id} has ${statName}=${value} (below ${minStat})`,
          { species: id, stat: statName, value },
          SEVERITY.WARNING
        ));
      }

      if (value > maxStat) {
        issues.push(new Issue(
          'STAT_TOO_HIGH',
          `Species ${id} has ${statName}=${value} (above ${maxStat})`,
          { species: id, stat: statName, value },
          SEVERITY.WARNING
        ));
      }
    }

    // Check BST
    const bst = sp.bst || Object.values(stats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

    if (bst < minBst) {
      issues.push(new Issue(
        'BST_TOO_LOW',
        `Species ${id} has BST=${bst} (below ${minBst})`,
        { species: id, bst },
        SEVERITY.INFO
      ));
    }

    if (bst > maxBst) {
      issues.push(new Issue(
        'BST_TOO_HIGH',
        `Species ${id} has BST=${bst} (above ${maxBst})`,
        { species: id, bst },
        SEVERITY.INFO
      ));
    }

    // Verify BST calculation
    const calculatedBst = Object.values(stats).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    if (sp.bst && Math.abs(sp.bst - calculatedBst) > 1) {
      issues.push(new Issue(
        'BST_MISMATCH',
        `Species ${id} has bst=${sp.bst} but calculated=${calculatedBst}`,
        { species: id, stated: sp.bst, calculated: calculatedBst },
        SEVERITY.ERROR
      ));
    }
  }

  return issues;
}

/**
 * Validate move sanity
 */
function validateMoveSanity(moves, types, config = {}) {
  const issues = [];
  const typeSet = new Set(types.map(t => t.id || t.name || t));
  const {
    maxPower = 250,
    maxAccuracy = 100,
    maxPP = 40
  } = config;

  for (const move of moves) {
    const id = move.id || move.name;

    // Validate type reference
    if (move.type && !typeSet.has(move.type) && !typeSet.has(move.type?.toUpperCase())) {
      issues.push(new Issue(
        'INVALID_MOVE_TYPE',
        `Move ${id} has unknown type: ${move.type}`,
        { move: id, type: move.type },
        SEVERITY.WARNING
      ));
    }

    // Validate power
    if (move.power && move.power > maxPower) {
      issues.push(new Issue(
        'MOVE_POWER_HIGH',
        `Move ${id} has power=${move.power} (above ${maxPower})`,
        { move: id, power: move.power },
        SEVERITY.INFO
      ));
    }

    // Validate accuracy
    if (move.accuracy && move.accuracy > maxAccuracy) {
      issues.push(new Issue(
        'MOVE_ACCURACY_INVALID',
        `Move ${id} has accuracy=${move.accuracy} (above ${maxAccuracy})`,
        { move: id, accuracy: move.accuracy },
        SEVERITY.WARNING
      ));
    }
  }

  return issues;
}

/**
 * Validate learnset references
 */
function validateLearnsets(learnsets, species, moves) {
  const issues = [];
  const speciesSet = new Set(species.map(s => s.id || s.species));
  const moveSet = new Set(moves.map(m => m.id || m.name));

  for (const ls of learnsets) {
    const speciesId = ls.species || ls.speciesId;

    // Validate species reference
    if (!speciesSet.has(speciesId)) {
      issues.push(new Issue(
        'LEARNSET_INVALID_SPECIES',
        `Learnset references unknown species: ${speciesId}`,
        { species: speciesId },
        SEVERITY.ERROR
      ));
    }

    // Validate move references
    const allMoves = [
      ...(ls.levelUp || []).map(m => m.move || m[1]),
      ...(ls.tm || []),
      ...(ls.tutor || []),
      ...(ls.egg || [])
    ].filter(Boolean);

    for (const moveId of allMoves) {
      if (!moveSet.has(moveId) && !moveSet.has(moveId?.toUpperCase())) {
        issues.push(new Issue(
          'LEARNSET_INVALID_MOVE',
          `Species ${speciesId} learnset references unknown move: ${moveId}`,
          { species: speciesId, move: moveId },
          SEVERITY.WARNING
        ));
      }
    }
  }

  return issues;
}

/**
 * Validate assets
 */
function validateAssets(assetsData, config = {}) {
  const issues = [];

  // Handle both formats: { assets: [...] } or [...]
  const assets = assetsData?.assets || assetsData || [];

  if (!Array.isArray(assets)) {
    issues.push(new Issue(
      'INVALID_ASSETS_FORMAT',
      'Assets data is not an array',
      {},
      SEVERITY.ERROR
    ));
    return issues;
  }

  for (const asset of assets) {
    const id = `${asset.speciesId || asset.species_id || 'unknown'}_${asset.formId || 0}`;
    const assetPaths = asset.assets || asset;

    // Check for missing critical assets
    if (!assetPaths.front && !assetPaths.front_path && !assetPaths.icon && !assetPaths.icon_path) {
      issues.push(new Issue(
        'MISSING_SPRITE',
        `Species ${id} has no front sprite or icon`,
        { species: id },
        SEVERITY.WARNING,
        'Check Graphics/EBDX/Battlers/Front/ or Graphics/Pokemon/Icons/'
      ));
    }
  }

  return issues;
}

/**
 * Validate world facts
 */
function validateWorldFacts(facts) {
  const issues = [];

  for (const fact of facts) {
    // 1. Check page_index and command_index
    if (fact.pageIndex === null || fact.pageIndex === undefined) {
      issues.push(new Issue(
        'NULL_PAGE_INDEX',
        `Fact ${fact.id} has null pageIndex`,
        { factId: fact.id },
        SEVERITY.ERROR
      ));
    } else if (fact.pageIndex < 0 && !fact.reason?.includes('legacy')) {
      // Requirement: "If -1, must include a reason explaining why"
      if (fact.pageIndex === -1 && (!fact.reason || fact.reason === '')) {
        issues.push(new Issue(
          'MISSING_REASON',
          `Fact ${fact.id} has pageIndex=-1 (unknown) but no reason provided`,
          { factId: fact.id },
          SEVERITY.WARNING
        ));
      }
    }

    if (fact.commandIndex === null || fact.commandIndex === undefined) {
      issues.push(new Issue(
        'NULL_COMMAND_INDEX',
        `Fact ${fact.id} has null commandIndex`,
        { factId: fact.id },
        SEVERITY.ERROR
      ));
    }
  }

  // Aggregate check: ensure NO nulls exist
  const nullCount = facts.filter(f => f.pageIndex === null || f.pageIndex === undefined).length;
  if (nullCount > 0) {
    issues.push(new Issue(
      'DATA_CORRUPTION',
      `Found ${nullCount} facts with NULL page_index`,
      { count: nullCount },
      SEVERITY.ERROR
    ));
  }

  return issues;
}

/**
 * Validate uniqueness
 */
function validateUniqueness(species, moves) {
  const issues = [];

  // Check species uniqueness
  const speciesKeys = new Map();
  for (const sp of species) {
    const key = `${sp.id || sp.species}_${sp.formId || 0}`;
    if (speciesKeys.has(key)) {
      issues.push(new Issue(
        'DUPLICATE_SPECIES',
        `Duplicate species key: ${key}`,
        { key },
        SEVERITY.ERROR
      ));
    }
    speciesKeys.set(key, true);
  }

  // Check move uniqueness
  const moveIds = new Map();
  for (const move of moves) {
    const id = move.id || move.name;
    if (moveIds.has(id)) {
      issues.push(new Issue(
        'DUPLICATE_MOVE',
        `Duplicate move ID: ${id}`,
        { move: id },
        SEVERITY.ERROR
      ));
    }
    moveIds.set(id, true);
  }

  return issues;
}

/**
 * Run all validations on a build
 */
export function validateBuild(buildDir, config = {}) {
  console.log(`Validating build: ${buildDir}`);

  const species = loadBuildData(buildDir, 'species.json');
  const moves = loadBuildData(buildDir, 'moves.json');
  const types = loadBuildData(buildDir, 'types.json');
  const abilities = loadBuildData(buildDir, 'abilities.json');
  const learnsets = loadBuildData(buildDir, 'learnsets.json');
  const assets = loadBuildData(buildDir, 'assets_manifest.json');
  const worldFacts = loadBuildData(buildDir, 'world_facts.json');

  const allIssues = [];

  // Run validations
  if (species && types && abilities) {
    console.log('  Checking referential integrity...');
    allIssues.push(...validateSpeciesIntegrity(species.data || [], types.data || [], abilities.data || []));
  }

  if (species) {
    console.log('  Checking stat sanity...');
    allIssues.push(...validateStatSanity(species.data || [], config));
  }

  if (moves && types) {
    console.log('  Checking move sanity...');
    allIssues.push(...validateMoveSanity(moves.data || [], types.data || [], config));
  }

  if (learnsets && species && moves) {
    console.log('  Checking learnset references...');
    allIssues.push(...validateLearnsets(learnsets.data || [], species.data || [], moves.data || []));
  }

  if (assets) {
    console.log('  Checking assets...');
    allIssues.push(...validateAssets(assets.data || assets || [], config));
  }

  if (species && moves) {
    console.log('  Checking uniqueness...');
    allIssues.push(...validateUniqueness(species.data || [], moves.data || []));
  }

  if (worldFacts) {
    console.log('  Checking world facts...');
    allIssues.push(...validateWorldFacts(worldFacts.data || worldFacts || []));
  }

  // Generate report
  const report = {
    buildDir,
    timestamp: new Date().toISOString(),
    summary: {
      total: allIssues.length,
      errors: allIssues.filter(i => i.severity === SEVERITY.ERROR).length,
      warnings: allIssues.filter(i => i.severity === SEVERITY.WARNING).length,
      info: allIssues.filter(i => i.severity === SEVERITY.INFO).length
    },
    issues: allIssues
  };

  return report;
}

/**
 * Generate markdown report
 */
export function generateValidationMarkdown(report) {
  const lines = [];

  lines.push('# Validation Report');
  lines.push('');
  lines.push(`**Build:** ${report.buildDir}`);
  lines.push(`**Generated:** ${report.timestamp}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| 🔴 Errors | ${report.summary.errors} |`);
  lines.push(`| 🟡 Warnings | ${report.summary.warnings} |`);
  lines.push(`| 🔵 Info | ${report.summary.info} |`);
  lines.push(`| **Total** | **${report.summary.total}** |`);
  lines.push('');

  if (report.summary.errors > 0) {
    lines.push('## 🔴 Errors');
    lines.push('');
    for (const issue of report.issues.filter(i => i.severity === SEVERITY.ERROR)) {
      lines.push(`- **${issue.code}**: ${issue.message}`);
      if (issue.suggestion) {
        lines.push(`  - 💡 ${issue.suggestion}`);
      }
    }
    lines.push('');
  }

  if (report.summary.warnings > 0) {
    lines.push('## 🟡 Warnings');
    lines.push('');
    const warnings = report.issues.filter(i => i.severity === SEVERITY.WARNING);
    for (const issue of warnings.slice(0, 50)) {
      lines.push(`- **${issue.code}**: ${issue.message}`);
    }
    if (warnings.length > 50) {
      lines.push(`- ... and ${warnings.length - 50} more warnings`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * CLI entry point
 */
export function runValidation(buildId, outputDir) {
  const buildDir = buildId && buildId.includes('/') ? buildId :
    (buildId ? join(BUILDS_DIR, buildId) : null);

  // Try build dir first, then out/ directory
  let targetDir = buildDir;
  if (!targetDir || !existsSync(targetDir)) {
    targetDir = join(REPO_ROOT, 'out');
    if (!existsSync(targetDir)) {
      throw new Error(`Build not found: ${buildDir || 'out'}`);
    }
    console.log('Using out/ directory for validation');
  }

  const report = validateBuild(targetDir);
  const markdown = generateValidationMarkdown(report);

  // Write outputs
  const reportPath = join(outputDir || targetDir, 'validation_report.json');
  const mdPath = join(outputDir || targetDir, 'validation_report.md');

  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  writeFileSync(mdPath, markdown);

  console.log('');
  console.log(`Validation complete:`);
  console.log(`  Errors: ${report.summary.errors}`);
  console.log(`  Warnings: ${report.summary.warnings}`);
  console.log(`  Info: ${report.summary.info}`);
  console.log(`  Report: ${reportPath}`);

  return report;
}

// CLI execution
if (process.argv[1].includes('validate')) {
  const buildId = process.argv[2] || null;
  const outputDir = process.argv[3] || null;

  try {
    runValidation(buildId, outputDir);
    process.exit(0);
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

export default {
  validateBuild,
  generateValidationMarkdown,
  runValidation,
  SEVERITY,
  Issue
};
