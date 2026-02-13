/**
 * Build System for Xenoverse Dex
 * Manages versioned builds, artifacts, and deterministic outputs
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, cpSync, unlinkSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const BUILDS_DIR = join(REPO_ROOT, 'out/builds');
const LATEST_DIR = join(REPO_ROOT, 'out/latest');
const DATA_DIR = join(REPO_ROOT, 'Data');

/**
 * Generate a deterministic build ID
 * Format: YYYYMMDD-HHMMSS-<short_git_sha>
 */
export function generateBuildId() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:T]/g, '')
    .replace(/\..+/, '')
    .slice(0, 15);
  
  const gitSha = getGitSha();
  const shortSha = gitSha ? gitSha.slice(0, 7) : 'nogit';
  
  return `${timestamp.slice(0, 8)}-${timestamp.slice(8)}-${shortSha}`;
}

/**
 * Get git SHA if available
 */
export function getGitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

/**
 * Get git status (clean/dirty)
 */
export function getGitStatus() {
  try {
    const status = execSync('git status --porcelain', { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
    return status ? 'dirty' : 'clean';
  } catch {
    return 'unknown';
  }
}

/**
 * Hash a file's contents
 */
export function hashFile(filepath) {
  if (!existsSync(filepath)) return null;
  const content = readFileSync(filepath);
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Hash a directory's contents (shallow - just filenames and sizes)
 */
export function hashDirectory(dirpath) {
  if (!existsSync(dirpath)) return null;
  
  try {
    const files = readdirSync(dirpath, { withFileTypes: true })
      .filter(d => d.isFile())
      .map(d => d.name)
      .sort();
    
    const hash = createHash('sha256');
    for (const file of files) {
      const stat = readFileSync(join(dirpath, file));
      hash.update(`${file}:${stat.length}\n`);
    }
    return hash.digest('hex').slice(0, 16);
  } catch {
    return null;
  }
}

/**
 * Create build metadata
 */
export function createBuildMeta(buildId, options = {}) {
  const { inputHashes, outputHashes, metrics, tag, warnings = [] } = options;
  
  const meta = {
    build_id: buildId,
    timestamp: new Date().toISOString(),
    tag: tag || null,
    git_sha: getGitSha(),
    git_status: getGitStatus(),
    tool_version: '1.0.0',
    metrics: metrics || {},
    warnings_count: warnings.length,
    input_hashes: inputHashes || {
      'Data/species.dat': hashFile(join(DATA_DIR, 'species.dat')),
      'Data/moves.dat': hashFile(join(DATA_DIR, 'moves.dat')),
      'Data/types.dat': hashFile(join(DATA_DIR, 'types.dat')),
      'Data/abilities.dat': hashFile(join(DATA_DIR, 'abilities.dat')),
    },
    output_hashes: outputHashes || {}
  };
  
  return meta;
}

/**
 * Set up build directories
 */
export function setupBuildDirs(buildId) {
  const buildDir = join(BUILDS_DIR, buildId);
  const dataDir = join(buildDir, 'data');
  const dbDir = join(buildDir, 'db');
  
  mkdirSync(buildDir, { recursive: true });
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(dbDir, { recursive: true });
  
  return {
    build: buildDir,
    data: dataDir,
    db: dbDir
  };
}

/**
 * Update latest symlink/copy
 */
export function updateLatest(buildId) {
  const buildDir = join(BUILDS_DIR, buildId);
  
  // Remove old latest
  if (existsSync(LATEST_DIR)) {
    try {
      rmSync(LATEST_DIR, { recursive: true, force: true });
    } catch {}
  }
  
  mkdirSync(LATEST_DIR, { recursive: true });
  
  // Copy build files to latest
  cpSync(buildDir, LATEST_DIR, { recursive: true });
}

/**
 * Write JSON with deterministic ordering
 */
export function writeJsonDeterministic(data, filepath) {
  const sorted = sortObjectKeys(data);
  writeFileSync(filepath, JSON.stringify(sorted, null, 2) + '\n');
}

/**
 * Recursively sort object keys for deterministic output
 */
function sortObjectKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

/**
 * List all available builds
 */
export function listBuilds() {
  if (!existsSync(BUILDS_DIR)) return [];
  
  return readdirSync(BUILDS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const metaPath = join(BUILDS_DIR, d.name, 'meta.json');
      let meta = null;
      if (existsSync(metaPath)) {
        try {
          meta = JSON.parse(readFileSync(metaPath, 'utf8'));
        } catch {}
      }
      return {
        id: d.name,
        meta
      };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}

/**
 * Get build by ID
 */
export function getBuild(buildId) {
  const buildDir = join(BUILDS_DIR, buildId);
  if (!existsSync(buildDir)) return null;
  
  const metaPath = join(buildDir, 'meta.json');
  const meta = existsSync(metaPath) 
    ? JSON.parse(readFileSync(metaPath, 'utf8'))
    : null;
  
  return {
    id: buildId,
    dir: buildDir,
    meta
  };
}

export default {
  generateBuildId,
  getGitSha,
  getGitStatus,
  hashFile,
  hashDirectory,
  createBuildMeta,
  setupBuildDirs,
  updateLatest,
  writeJsonDeterministic,
  listBuilds,
  getBuild
};
