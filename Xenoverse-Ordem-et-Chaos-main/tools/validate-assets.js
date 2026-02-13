/**
 * Asset Correctness Validator for Xenoverse Dex
 * Validates sprite dimensions, file integrity, and detects issues
 */

import { readFileSync, existsSync, statSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const OUT_DIR = join(REPO_ROOT, 'out');

// PNG signature: 137 80 78 71 13 10 26 10
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

// OGG signature: OggS
const OGG_SIGNATURE = Buffer.from([0x4F, 0x67, 0x67, 0x53]);

// WAV signature: RIFF
const WAV_SIGNATURE = Buffer.from([0x52, 0x49, 0x46, 0x46]);

/**
 * Read PNG dimensions from file header
 * Returns { width, height } or null if not a valid PNG
 */
function readPngDimensions(filepath) {
  if (!existsSync(filepath)) return null;
  
  try {
    const buffer = readFileSync(filepath);
    
    // Check PNG signature
    if (buffer.length < 24) return null;
    if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
    
    // IHDR chunk should be at bytes 8-20
    // Width is at bytes 16-19 (big-endian)
    // Height is at bytes 20-23 (big-endian)
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    
    return { width, height };
  } catch {
    return null;
  }
}

/**
 * Detect file type from signature
 */
function detectFileType(filepath) {
  if (!existsSync(filepath)) return null;
  
  try {
    const buffer = readFileSync(filepath);
    if (buffer.length < 8) return 'unknown';
    
    const header = buffer.subarray(0, 8);
    
    if (header.subarray(0, 8).equals(PNG_SIGNATURE)) return 'png';
    if (header.subarray(0, 4).equals(OGG_SIGNATURE)) return 'ogg';
    if (header.subarray(0, 4).equals(WAV_SIGNATURE)) return 'wav';
    
    // Check for MIDI (MThd)
    if (buffer.subarray(0, 4).toString() === 'MThd') return 'midi';
    
    // Check for MP3 (ID3 or frame sync)
    if (buffer.subarray(0, 3).toString() === 'ID3') return 'mp3';
    if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) return 'mp3';
    
    return 'unknown';
  } catch {
    return 'error';
  }
}

/**
 * Analyze sprite type based on dimensions
 */
function analyzeSpriteDimensions(dims) {
  if (!dims) return { type: 'unknown', frameCount: 0 };
  
  const { width, height } = dims;
  
  // Single frame sprites
  if (width === height) {
    return {
      type: 'single-frame',
      frameSize: width,
      frameCount: 1,
      isAnimated: false
    };
  }
  
  // EBDX sprite sheet: width > height, and width should be multiple of height
  if (width > height && width % height === 0) {
    const frameCount = width / height;
    return {
      type: 'ebdx-strip',
      frameSize: height,
      frameCount,
      isAnimated: true,
      stripWidth: width
    };
  }
  
  // Vertical strip (less common)
  if (height > width && height % width === 0) {
    const frameCount = height / width;
    return {
      type: 'vertical-strip',
      frameSize: width,
      frameCount,
      isAnimated: true
    };
  }
  
  // Unknown format
  return {
    type: 'irregular',
    width,
    height,
    frameCount: 1,
    note: 'Non-standard dimensions'
  };
}

/**
 * Validate asset file
 */
function validateAssetFile(filepath, expectedType = null) {
  const result = {
    path: filepath,
    exists: existsSync(filepath),
    valid: false,
    issues: []
  };
  
  if (!result.exists) {
    result.issues.push('File not found');
    return result;
  }
  
  try {
    const stat = statSync(filepath);
    result.size = stat.size;
    
    if (stat.size === 0) {
      result.issues.push('Empty file');
      return result;
    }
    
    const detectedType = detectFileType(filepath);
    result.detectedType = detectedType;
    
    if (expectedType && detectedType !== expectedType) {
      result.issues.push(`Expected ${expectedType}, detected ${detectedType}`);
    }
    
    if (detectedType === 'png') {
      const dims = readPngDimensions(filepath);
      result.dimensions = dims;
      
      if (dims) {
        const analysis = analyzeSpriteDimensions(dims);
        result.spriteInfo = analysis;
        result.valid = true;
      } else {
        result.issues.push('Could not read PNG dimensions');
      }
    } else if (['ogg', 'wav', 'mp3'].includes(detectedType)) {
      result.valid = true;
    } else if (detectedType === 'error') {
      result.issues.push('Error reading file');
    } else if (detectedType === 'unknown') {
      result.issues.push('Unknown file type');
    } else {
      result.valid = true;
    }
  } catch (error) {
    result.issues.push(`Error: ${error.message}`);
  }
  
  return result;
}

/**
 * Validate all assets for a species
 */
function validateSpeciesAssets(speciesId, assetPaths, repoRoot) {
  const results = {
    speciesId,
    valid: true,
    assets: {},
    issues: []
  };
  
  for (const [assetType, relativePath] of Object.entries(assetPaths)) {
    if (!relativePath) continue;
    
    const fullPath = join(repoRoot, relativePath);
    const expectedType = ['icon', 'front', 'frontShiny', 'back', 'backShiny', 'egg'].includes(assetType) ? 'png' : null;
    
    const validation = validateAssetFile(fullPath, expectedType);
    results.assets[assetType] = validation;
    
    if (!validation.valid) {
      results.valid = false;
      results.issues.push(...validation.issues.map(i => `${assetType}: ${i}`));
    }
  }
  
  return results;
}

/**
 * Scan asset directory and collect statistics
 */
function scanAssetDirectory(dirPath, repoRoot) {
  const fullPath = join(repoRoot, dirPath);
  if (!existsSync(fullPath)) {
    return { exists: false, files: 0, stats: null };
  }
  
  const files = readdirSync(fullPath).filter(f => 
    !f.includes(':Zone.Identifier') && !f.startsWith('.')
  );
  
  const stats = {
    total: files.length,
    byType: {},
    bySpriteType: {},
    dimensionStats: {
      minWidth: Infinity,
      maxWidth: 0,
      minHeight: Infinity,
      maxHeight: 0,
      commonSizes: {}
    },
    issues: []
  };
  
  // Sample up to 100 files for detailed analysis
  const sampleSize = Math.min(files.length, 100);
  const sample = files.slice(0, sampleSize);
  
  for (const file of sample) {
    const filepath = join(fullPath, file);
    const detectedType = detectFileType(filepath);
    stats.byType[detectedType] = (stats.byType[detectedType] || 0) + 1;
    
    if (detectedType === 'png') {
      const dims = readPngDimensions(filepath);
      if (dims) {
        stats.dimensionStats.minWidth = Math.min(stats.dimensionStats.minWidth, dims.width);
        stats.dimensionStats.maxWidth = Math.max(stats.dimensionStats.maxWidth, dims.width);
        stats.dimensionStats.minHeight = Math.min(stats.dimensionStats.minHeight, dims.height);
        stats.dimensionStats.maxHeight = Math.max(stats.dimensionStats.maxHeight, dims.height);
        
        const sizeKey = `${dims.width}x${dims.height}`;
        stats.dimensionStats.commonSizes[sizeKey] = (stats.dimensionStats.commonSizes[sizeKey] || 0) + 1;
        
        const analysis = analyzeSpriteDimensions(dims);
        stats.bySpriteType[analysis.type] = (stats.bySpriteType[analysis.type] || 0) + 1;
      }
    }
  }
  
  // Scale counts based on sample
  if (sampleSize < files.length) {
    const scale = files.length / sampleSize;
    stats._note = `Sampled ${sampleSize} of ${files.length} files`;
  }
  
  return { exists: true, files: files.length, stats };
}

/**
 * Run full asset validation
 */
export function validateAssets(repoRoot = REPO_ROOT) {
  console.log('Running asset validation...');
  const startTime = Date.now();
  
  const report = {
    timestamp: new Date().toISOString(),
    directories: {},
    summary: {
      totalFiles: 0,
      validFiles: 0,
      issues: 0
    }
  };
  
  // Asset directories to scan
  const directories = {
    icons: 'Graphics/Pokemon/Icons',
    front: 'Graphics/EBDX/Battlers/Front',
    frontShiny: 'Graphics/EBDX/Battlers/FrontShiny',
    back: 'Graphics/EBDX/Battlers/Back',
    backShiny: 'Graphics/EBDX/Battlers/BackShiny',
    eggs: 'Graphics/Pokemon/Eggs',
    eggsEBDX: 'Graphics/EBDX/Battlers/Eggs',
    cries: 'Audio/SE/Cries'
  };
  
  for (const [name, path] of Object.entries(directories)) {
    console.log(`  Scanning ${name}...`);
    const scan = scanAssetDirectory(path, repoRoot);
    report.directories[name] = scan;
    report.summary.totalFiles += scan.files || 0;
  }
  
  const duration = Date.now() - startTime;
  report.duration = duration;
  
  console.log(`\nAsset validation complete in ${duration}ms`);
  console.log(`Total files: ${report.summary.totalFiles}`);
  
  // Print dimension analysis for EBDX sprites
  console.log('\nEBDX Front Sprites Analysis:');
  const frontStats = report.directories.front?.stats;
  if (frontStats) {
    console.log(`  Height range: ${frontStats.dimensionStats.minHeight}-${frontStats.dimensionStats.maxHeight}px`);
    console.log(`  Width range: ${frontStats.dimensionStats.minWidth}-${frontStats.dimensionStats.maxWidth}px`);
    console.log(`  Sprite types: ${JSON.stringify(frontStats.bySpriteType)}`);
    
    // Top 5 most common sizes
    const sizes = Object.entries(frontStats.dimensionStats.commonSizes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log('  Common sizes:', sizes.map(([s, c]) => `${s}(${c})`).join(', '));
  }
  
  return report;
}

/**
 * Generate detailed asset report
 */
export function generateAssetReport(repoRoot = REPO_ROOT, outputPath = null) {
  const report = validateAssets(repoRoot);
  
  // Generate markdown
  const lines = [];
  lines.push('# Asset Correctness Report');
  lines.push('');
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`Duration: ${report.duration}ms`);
  lines.push('');
  
  lines.push('## Directory Summary');
  lines.push('');
  lines.push('| Directory | Files | Status |');
  lines.push('|-----------|-------|--------|');
  
  for (const [name, data] of Object.entries(report.directories)) {
    const status = data.exists ? '✅' : '❌';
    lines.push(`| ${name} | ${data.files || 0} | ${status} |`);
  }
  lines.push('');
  
  lines.push('## Sprite Type Analysis');
  lines.push('');
  
  for (const [name, data] of Object.entries(report.directories)) {
    if (data.stats?.bySpriteType && Object.keys(data.stats.bySpriteType).length > 0) {
      lines.push(`### ${name}`);
      lines.push('');
      for (const [type, count] of Object.entries(data.stats.bySpriteType)) {
        lines.push(`- ${type}: ${count}`);
      }
      lines.push('');
    }
  }
  
  const markdown = lines.join('\n');
  
  if (outputPath) {
    writeFileSync(outputPath, markdown);
    console.log(`Report written to: ${outputPath}`);
  }
  
  return { report, markdown };
}

// CLI
if (process.argv[1].includes('validate-assets')) {
  validateAssets();
}

export default {
  readPngDimensions,
  detectFileType,
  analyzeSpriteDimensions,
  validateAssetFile,
  validateSpeciesAssets,
  scanAssetDirectory,
  validateAssets,
  generateAssetReport
};
