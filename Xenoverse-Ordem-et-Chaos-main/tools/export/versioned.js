/**
 * Versioned Export Pipeline
 * Runs export + assets + ingest and stores versioned build artifacts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { generateBuildId, createBuildMeta, setupBuildDirs, updateLatest, hashFile, writeJsonDeterministic } from '../build.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const OUT_DIR = join(REPO_ROOT, 'out');
const BUILDS_DIR = join(REPO_ROOT, 'out/builds');

/**
 * Run the standard export pipeline
 */
function runExportPipeline() {
  console.log('Running export pipeline...');
  const startTime = Date.now();
  
  try {
    // Run export
    console.log('  [1/3] Exporting data from .dat files...');
    execSync('node tools/export/index.js', { 
      cwd: REPO_ROOT, 
      stdio: 'inherit' 
    });
    
    // Run assets
    console.log('  [2/3] Scanning assets...');
    execSync('node tools/assets/index.js', { 
      cwd: REPO_ROOT, 
      stdio: 'inherit' 
    });
    
    // Run ingest
    console.log('  [3/3] Ingesting into database...');
    execSync('node tools/ingest/index.js', { 
      cwd: REPO_ROOT, 
      stdio: 'inherit' 
    });
    
    const duration = Date.now() - startTime;
    console.log(`Pipeline completed in ${duration}ms`);
    return true;
  } catch (error) {
    console.error('Pipeline failed:', error.message);
    return false;
  }
}

/**
 * Collect all JSON outputs from out/
 */
function collectArtifacts() {
  const artifacts = {};
  const jsonFiles = readdirSync(OUT_DIR).filter(f => f.endsWith('.json'));
  
  for (const file of jsonFiles) {
    const filepath = join(OUT_DIR, file);
    try {
      const content = JSON.parse(readFileSync(filepath, 'utf8'));
      artifacts[file.replace('.json', '')] = content;
    } catch (e) {
      console.warn(`  Warning: Could not read ${file}:`, e.message);
    }
  }
  
  return artifacts;
}

/**
 * Create versioned build
 */
async function createVersionedBuild(options = {}) {
  const { skipExport = false, tag = null } = options;
  
  console.log('='.repeat(60));
  console.log('VERSIONED BUILD');
  console.log('='.repeat(60));
  console.log('');
  
  // Step 1: Run export pipeline
  if (!skipExport) {
    const success = runExportPipeline();
    if (!success) {
      throw new Error('Export pipeline failed');
    }
  } else {
    console.log('Skipping export (using existing out/ contents)');
  }
  console.log('');
  
  // Step 2: Generate build ID and setup directories
  const buildId = generateBuildId();
  console.log(`Build ID: ${buildId}`);
  
  const dirs = setupBuildDirs(buildId);
  console.log(`Build directory: ${dirs.build}`);
  console.log('');
  
  // Step 3: Collect artifacts
  console.log('Collecting artifacts...');
  const artifacts = collectArtifacts();
  console.log(`  Found ${Object.keys(artifacts).length} JSON files`);
  
  // Step 4: Create canonical output files with deterministic JSON
  console.log('Writing versioned artifacts...');
  
  const fileHashes = {};
  for (const [name, data] of Object.entries(artifacts)) {
    const outPath = join(dirs.data, `${name}.json`);
    writeJsonDeterministic(data, outPath);
    fileHashes[`${name}.json`] = hashFile(outPath);
    console.log(`  ${name}.json (${fileHashes[`${name}.json`].slice(0, 8)}...)`);
  }
  
  // Copy database
  const dbSource = join(OUT_DIR, 'dex.db');
  if (existsSync(dbSource)) {
    const dbDest = join(dirs.db, 'dex.db');
    copyFileSync(dbSource, dbDest);
    fileHashes['dex.db'] = hashFile(dbDest);
    console.log(`  dex.db (${fileHashes['dex.db'].slice(0, 8)}...)`);
  }
  
  // Step 5: Generate summary metrics
  const metrics = {
    species: artifacts.species?.data?.length || 0,
    moves: artifacts.moves?.data?.length || 0,
    types: artifacts.types?.data?.length || 0,
    abilities: artifacts.abilities?.data?.length || 0,
    evolutions: artifacts.evolutions?.data?.length || 0,
    learnsets: artifacts.learnsets?.data?.length || 0
  };
  
  // Step 6: Create build metadata
  const meta = createBuildMeta(buildId, {
    inputHashes: {
      'species.dat': hashFile(join(REPO_ROOT, 'Data/species.dat')),
      'moves.dat': hashFile(join(REPO_ROOT, 'Data/moves.dat')),
      'types.dat': hashFile(join(REPO_ROOT, 'Data/types.dat')),
      'abilities.dat': hashFile(join(REPO_ROOT, 'Data/abilities.dat'))
    },
    outputHashes: fileHashes,
    metrics,
    tag
  });
  
  // Write meta.json
  writeJsonDeterministic(meta, join(dirs.build, 'meta.json'));
  console.log('  meta.json');
  
  // Step 7: Update latest symlink
  updateLatest(buildId);
  console.log('');
  console.log('Updated latest symlink');
  
  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log('BUILD SUMMARY');
  console.log('='.repeat(60));
  console.log(`Build ID: ${buildId}`);
  console.log(`Species: ${metrics.species}`);
  console.log(`Moves: ${metrics.moves}`);
  console.log(`Types: ${metrics.types}`);
  console.log(`Abilities: ${metrics.abilities}`);
  console.log(`Evolutions: ${metrics.evolutions}`);
  console.log(`Learnsets: ${metrics.learnsets}`);
  console.log('');
  
  return {
    buildId,
    buildDir: dirs.build,
    meta,
    metrics
  };
}

// CLI entry point
if (process.argv[1].includes('versioned')) {
  const skipExport = process.argv.includes('--skip-export');
  const tagIdx = process.argv.indexOf('--tag');
  const tag = tagIdx !== -1 ? process.argv[tagIdx + 1] : null;
  
  createVersionedBuild({ skipExport, tag })
    .then(result => {
      console.log(`\nBuild complete: ${result.buildId}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('Build failed:', error.message);
      process.exit(1);
    });
}

export { createVersionedBuild, runExportPipeline, collectArtifacts };
