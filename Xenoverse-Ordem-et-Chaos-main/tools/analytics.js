/**
 * Analytics Tooling for Xenoverse Dex
 * Generates insights, statistics, and reports
 */

import Database from 'better-sqlite3';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'out');
const DB_PATH = join(OUT_DIR, 'dex.db');

/**
 * Generate type distribution analysis
 */
export function analyzeTypeDistribution(db) {
  console.log('Analyzing type distribution...');
  
  // Primary type distribution
  const primaryTypes = db.prepare(`
    SELECT type1 as type, COUNT(*) as count
    FROM species
    WHERE form_id = 0
    GROUP BY type1
    ORDER BY count DESC
  `).all();
  
  // Secondary type distribution
  const secondaryTypes = db.prepare(`
    SELECT type2 as type, COUNT(*) as count
    FROM species
    WHERE form_id = 0 AND type2 IS NOT NULL
    GROUP BY type2
    ORDER BY count DESC
  `).all();
  
  // Dual type combinations
  const dualTypes = db.prepare(`
    SELECT type1, type2, COUNT(*) as count
    FROM species
    WHERE form_id = 0 AND type2 IS NOT NULL
    GROUP BY type1, type2
    ORDER BY count DESC
    LIMIT 20
  `).all();
  
  // Monotype count
  const monoType = db.prepare(`
    SELECT COUNT(*) as count
    FROM species
    WHERE form_id = 0 AND type2 IS NULL
  `).get().count;
  
  return {
    primary: primaryTypes,
    secondary: secondaryTypes,
    dualCombinations: dualTypes,
    monoTypeCount: monoType,
    dualTypeCount: db.prepare('SELECT COUNT(*) FROM species WHERE form_id = 0 AND type2 IS NOT NULL').get()['COUNT(*)']
  };
}

/**
 * Generate stat distribution analysis
 */
export function analyzeStatDistribution(db) {
  console.log('Analyzing stat distribution...');
  
  const stats = ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed', 'bst'];
  const result = {};
  
  for (const stat of stats) {
    const analysis = db.prepare(`
      SELECT 
        MIN(${stat}) as min,
        MAX(${stat}) as max,
        AVG(${stat}) as avg,
        (SELECT ${stat} FROM species WHERE form_id = 0 ORDER BY ${stat} LIMIT 1 OFFSET 
          (SELECT COUNT(*)/2 FROM species WHERE form_id = 0)) as median
      FROM species
      WHERE form_id = 0
    `).get();
    
    // Get top 5 for this stat
    const top5 = db.prepare(`
      SELECT id, name, ${stat} as value
      FROM species
      WHERE form_id = 0
      ORDER BY ${stat} DESC
      LIMIT 5
    `).all();
    
    // Get bottom 5
    const bottom5 = db.prepare(`
      SELECT id, name, ${stat} as value
      FROM species
      WHERE form_id = 0 AND ${stat} > 0
      ORDER BY ${stat} ASC
      LIMIT 5
    `).all();
    
    result[stat] = {
      min: analysis.min,
      max: analysis.max,
      avg: Math.round(analysis.avg * 10) / 10,
      median: analysis.median,
      top5,
      bottom5
    };
  }
  
  return result;
}

/**
 * Analyze evolution patterns
 */
export function analyzeEvolutions(db) {
  console.log('Analyzing evolution patterns...');
  
  // Evolution methods
  const methods = db.prepare(`
    SELECT method, COUNT(*) as count
    FROM evolutions
    GROUP BY method
    ORDER BY count DESC
  `).all();
  
  // Species with most evolutions
  const mostEvolutions = db.prepare(`
    SELECT species_id, COUNT(*) as evo_count
    FROM evolutions
    GROUP BY species_id
    ORDER BY evo_count DESC
    LIMIT 10
  `).all();
  
  // Evolution family sizes
  const familySizes = db.prepare(`
    SELECT 
      family_id,
      COUNT(*) as size,
      MAX(stage) as max_stage
    FROM evolution_families
    GROUP BY family_id
    ORDER BY size DESC
    LIMIT 10
  `).all();
  
  return {
    methods,
    speciesWithMostBranches: mostEvolutions,
    largestFamilies: familySizes,
    totalFamilies: db.prepare('SELECT COUNT(DISTINCT family_id) FROM evolution_families').get()['COUNT(DISTINCT family_id)']
  };
}

/**
 * Analyze move distribution
 */
export function analyzeMoves(db) {
  console.log('Analyzing moves...');
  
  // By type
  const byType = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM moves
    WHERE type IS NOT NULL
    GROUP BY type
    ORDER BY count DESC
  `).all();
  
  // By category
  const byCategory = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM moves
    GROUP BY category
    ORDER BY count DESC
  `).all();
  
  // Power distribution
  const powerRanges = db.prepare(`
    SELECT 
      CASE 
        WHEN power IS NULL THEN 'Status'
        WHEN power = 0 THEN 'Variable'
        WHEN power <= 40 THEN '1-40'
        WHEN power <= 60 THEN '41-60'
        WHEN power <= 80 THEN '61-80'
        WHEN power <= 100 THEN '81-100'
        WHEN power <= 120 THEN '101-120'
        ELSE '120+'
      END as range,
      COUNT(*) as count
    FROM moves
    GROUP BY range
    ORDER BY 
      CASE range
        WHEN 'Status' THEN 0
        WHEN 'Variable' THEN 1
        WHEN '1-40' THEN 2
        WHEN '41-60' THEN 3
        WHEN '61-80' THEN 4
        WHEN '81-100' THEN 5
        WHEN '101-120' THEN 6
        ELSE 7
      END
  `).all();
  
  // Most learned moves
  const mostLearned = db.prepare(`
    SELECT move_id, m.name, COUNT(DISTINCT species_id) as species_count
    FROM move_species ms
    JOIN moves m ON ms.move_id = m.id
    GROUP BY move_id
    ORDER BY species_count DESC
    LIMIT 10
  `).all();
  
  return {
    byType,
    byCategory,
    powerDistribution: powerRanges,
    mostLearnedMoves: mostLearned
  };
}

/**
 * Analyze abilities
 */
export function analyzeAbilities(db) {
  console.log('Analyzing abilities...');
  
  // Most common abilities
  const mostCommon = db.prepare(`
    SELECT ability_id, a.name, COUNT(DISTINCT species_id) as species_count, 
           SUM(CASE WHEN is_hidden = 1 THEN 1 ELSE 0 END) as hidden_count
    FROM ability_species asa
    JOIN abilities a ON asa.ability_id = a.id
    GROUP BY ability_id
    ORDER BY species_count DESC
    LIMIT 20
  `).all();
  
  // Rarest abilities (1-3 species)
  const rarest = db.prepare(`
    SELECT ability_id, a.name, COUNT(DISTINCT species_id) as species_count
    FROM ability_species asa
    JOIN abilities a ON asa.ability_id = a.id
    GROUP BY ability_id
    HAVING species_count <= 3
    ORDER BY species_count ASC
    LIMIT 20
  `).all();
  
  // Hidden ability stats
  const hiddenStats = db.prepare(`
    SELECT 
      COUNT(DISTINCT ability_id) as unique_hidden,
      COUNT(*) as total_hidden_slots
    FROM ability_species
    WHERE is_hidden = 1
  `).get();
  
  return {
    mostCommon,
    rarest,
    hiddenAbilityStats: hiddenStats
  };
}

/**
 * Generate BST tier analysis
 */
export function analyzeBSTTiers(db) {
  console.log('Analyzing BST tiers...');
  
  const tiers = db.prepare(`
    SELECT bst_tier, COUNT(*) as count
    FROM species_with_tiers
    WHERE form_id = 0
    GROUP BY bst_tier
    ORDER BY 
      CASE bst_tier
        WHEN 'very-low' THEN 1
        WHEN 'low' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'high' THEN 4
        WHEN 'pseudo-legendary' THEN 5
      END
  `).all();
  
  const speedTiers = db.prepare(`
    SELECT speed_tier, COUNT(*) as count
    FROM species_with_tiers
    WHERE form_id = 0
    GROUP BY speed_tier
    ORDER BY 
      CASE speed_tier
        WHEN 'ultra-slow' THEN 1
        WHEN 'slow' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'fast' THEN 4
        WHEN 'ultra-fast' THEN 5
      END
  `).all();
  
  return {
    bstTiers: tiers,
    speedTiers
  };
}

/**
 * Generate learnset coverage analysis
 */
export function analyzeLearnsetCoverage(db) {
  console.log('Analyzing learnset coverage...');
  
  const byMethod = db.prepare(`
    SELECT learn_method, COUNT(DISTINCT species_id) as species_count, COUNT(*) as total_entries
    FROM learnsets
    GROUP BY learn_method
    ORDER BY total_entries DESC
  `).all();
  
  // Species with most moves
  const mostMoves = db.prepare(`
    SELECT species_id, s.name, COUNT(DISTINCT move_id) as move_count
    FROM learnsets l
    JOIN species s ON l.species_id = s.id AND l.form_id = s.form_id
    GROUP BY l.species_id, l.form_id
    ORDER BY move_count DESC
    LIMIT 10
  `).all();
  
  // Species with fewest moves
  const fewestMoves = db.prepare(`
    SELECT species_id, s.name, COUNT(DISTINCT move_id) as move_count
    FROM learnsets l
    JOIN species s ON l.species_id = s.id AND l.form_id = s.form_id
    GROUP BY l.species_id, l.form_id
    HAVING move_count > 0
    ORDER BY move_count ASC
    LIMIT 10
  `).all();
  
  return {
    byMethod,
    mostMoves,
    fewestMoves
  };
}

/**
 * Generate full analytics report
 */
export function generateAnalytics(dbPath = DB_PATH) {
  console.log('='.repeat(60));
  console.log('ANALYTICS REPORT');
  console.log('='.repeat(60));
  console.log('');
  
  const db = new Database(dbPath, { readonly: true });
  const startTime = Date.now();
  
  try {
    const report = {
      timestamp: new Date().toISOString(),
      types: analyzeTypeDistribution(db),
      stats: analyzeStatDistribution(db),
      evolutions: analyzeEvolutions(db),
      moves: analyzeMoves(db),
      abilities: analyzeAbilities(db),
      bstTiers: analyzeBSTTiers(db),
      learnsets: analyzeLearnsetCoverage(db)
    };
    
    const duration = Date.now() - startTime;
    report.duration = duration;
    
    console.log(`\nAnalytics generated in ${duration}ms`);
    
    return report;
  } finally {
    db.close();
  }
}

/**
 * Generate markdown analytics report
 */
export function generateAnalyticsMarkdown(report) {
  const lines = [];
  
  lines.push('# Xenoverse Dex Analytics Report');
  lines.push('');
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`Duration: ${report.duration}ms`);
  lines.push('');
  
  // Type Distribution
  lines.push('## Type Distribution');
  lines.push('');
  lines.push('### Primary Types');
  lines.push('| Type | Count |');
  lines.push('|------|-------|');
  for (const t of report.types.primary.slice(0, 10)) {
    lines.push(`| ${t.type} | ${t.count} |`);
  }
  lines.push('');
  
  lines.push(`Monotype: ${report.types.monoTypeCount} | Dual-type: ${report.types.dualTypeCount}`);
  lines.push('');
  
  // Stat Highlights
  lines.push('## Stat Highlights');
  lines.push('');
  lines.push('| Stat | Min | Max | Avg |');
  lines.push('|------|-----|-----|-----|');
  for (const [stat, data] of Object.entries(report.stats)) {
    lines.push(`| ${stat} | ${data.min} | ${data.max} | ${data.avg} |`);
  }
  lines.push('');
  
  // Top BST
  lines.push('### Top 5 by BST');
  for (const sp of report.stats.bst.top5) {
    lines.push(`- ${sp.name}: ${sp.value}`);
  }
  lines.push('');
  
  // Evolution Methods
  lines.push('## Evolution Methods');
  lines.push('');
  for (const m of report.evolutions.methods.slice(0, 10)) {
    lines.push(`- ${m.method || 'Unknown'}: ${m.count}`);
  }
  lines.push('');
  
  // Most Common Abilities
  lines.push('## Most Common Abilities');
  lines.push('');
  for (const a of report.abilities.mostCommon.slice(0, 10)) {
    lines.push(`- ${a.name}: ${a.species_count} species`);
  }
  lines.push('');
  
  // Move Distribution
  lines.push('## Move Distribution');
  lines.push('');
  lines.push('### By Category');
  for (const c of report.moves.byCategory) {
    lines.push(`- ${c.category}: ${c.count}`);
  }
  lines.push('');
  
  lines.push('### Power Distribution');
  for (const p of report.moves.powerDistribution) {
    lines.push(`- ${p.range}: ${p.count}`);
  }
  lines.push('');
  
  // BST Tiers
  lines.push('## BST Tiers');
  lines.push('');
  for (const t of report.bstTiers.bstTiers) {
    lines.push(`- ${t.bst_tier}: ${t.count}`);
  }
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Save analytics to files
 */
export function saveAnalytics(dbPath = DB_PATH, outputDir = join(OUT_DIR, 'analytics')) {
  mkdirSync(outputDir, { recursive: true });
  
  const report = generateAnalytics(dbPath);
  const markdown = generateAnalyticsMarkdown(report);
  
  // Save JSON
  writeFileSync(join(outputDir, 'analytics.json'), JSON.stringify(report, null, 2));
  console.log(`Saved: ${join(outputDir, 'analytics.json')}`);
  
  // Save Markdown
  writeFileSync(join(outputDir, 'analytics.md'), markdown);
  console.log(`Saved: ${join(outputDir, 'analytics.md')}`);
  
  return report;
}

// CLI
if (process.argv[1].includes('analytics')) {
  saveAnalytics();
}

export default {
  analyzeTypeDistribution,
  analyzeStatDistribution,
  analyzeEvolutions,
  analyzeMoves,
  analyzeAbilities,
  analyzeBSTTiers,
  analyzeLearnsetCoverage,
  generateAnalytics,
  generateAnalyticsMarkdown,
  saveAnalytics
};
