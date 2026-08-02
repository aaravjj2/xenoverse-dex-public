/**
 * Asset Resolver for Xenoverse-Ordem-et-Chaos
 * Scans Graphics/ and Audio/ directories and maps assets to species/forms
 */

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from '../export/marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const DATA_DIR = join(REPO_ROOT, 'Data');
const OUT_DIR = join(REPO_ROOT, 'out');

// Asset directories configuration
const ASSET_PATHS = {
  icons: 'Graphics/Pokemon/Icons',
  front: 'Graphics/EBDX/Battlers/Front',
  frontShiny: 'Graphics/EBDX/Battlers/FrontShiny',
  back: 'Graphics/EBDX/Battlers/Back',
  backShiny: 'Graphics/EBDX/Battlers/BackShiny',
  eggs: 'Graphics/Pokemon/Eggs',
  eggsEBDX: 'Graphics/EBDX/Battlers/Eggs',
  cries: 'Audio/SE/Cries'
};

// Cry offset - Xenoverse uses 1300+ for regional dex
const CRY_OFFSET = 1300;

/**
 * Build species to dex number mapping from regional dex data
 */
function buildDexNumberMap() {
  const dexMap = new Map();
  
  try {
    const buffer = readFileSync(join(DATA_DIR, 'regional_dexes.dat'));
    const result = decode(buffer);
    
    // Regional dex is an array of dex arrays, first one is main regional dex
    if (Array.isArray(result.data)) {
      // Handle array format
      for (let dexIdx = 0; dexIdx < result.data.length; dexIdx++) {
        const dex = result.data[dexIdx];
        if (Array.isArray(dex)) {
          for (let i = 0; i < dex.length; i++) {
            const species = typeof dex[i] === 'string' ? dex[i] : dex[i]?.toString();
            if (species && !dexMap.has(species)) {
              // First regional dex uses 1300+ offset
              if (dexIdx === 0) {
                dexMap.set(species, CRY_OFFSET + i);
              }
            }
          }
        }
      }
    } else if (typeof result.data === 'object') {
      // Handle hash format
      for (const [key, dex] of Object.entries(result.data)) {
        if (Array.isArray(dex)) {
          for (let i = 0; i < dex.length; i++) {
            const species = typeof dex[i] === 'string' ? dex[i] : dex[i]?.toString();
            if (species && !dexMap.has(species)) {
              if (key === '0') {
                dexMap.set(species, CRY_OFFSET + i);
              }
            }
          }
        }
      }
    }
    
    console.log(`Built dex number map: ${dexMap.size} species`);
  } catch (error) {
    console.error(`Warning: Could not build dex map: ${error.message}`);
  }
  
  return dexMap;
}

/**
 * Get list of all files in a directory
 */
function listFiles(dirPath, extensions = null) {
  const fullPath = join(REPO_ROOT, dirPath);
  if (!existsSync(fullPath)) {
    return [];
  }
  
  try {
    const files = readdirSync(fullPath);
    return files.filter(f => {
      // Skip Zone.Identifier files
      if (f.includes(':Zone.Identifier') || f.endsWith('.Identifier')) return false;
      
      const stat = statSync(join(fullPath, f));
      if (!stat.isFile()) return false;
      
      if (extensions) {
        const ext = extname(f).toLowerCase();
        return extensions.includes(ext);
      }
      return true;
    });
  } catch (error) {
    console.error(`Error reading ${fullPath}: ${error.message}`);
    return [];
  }
}

/**
 * Parse species ID from filename
 * Supports formats: 001.png, BULBASAUR.png, 001_1.png (form 1)
 */
function parseAssetFilename(filename) {
  const name = basename(filename, extname(filename));
  
  // Pattern: NNN or NNN_F (numeric with optional form)
  const numericMatch = name.match(/^(\d+)(?:_(\d+))?$/);
  if (numericMatch) {
    return {
      speciesId: parseInt(numericMatch[1], 10),
      formId: numericMatch[2] ? parseInt(numericMatch[2], 10) : 0,
      type: 'numeric'
    };
  }
  
  // Pattern: NAME or NAME_F (named with optional form)
  const namedMatch = name.match(/^([A-Za-z]+)(?:_(\d+))?$/);
  if (namedMatch) {
    return {
      speciesName: namedMatch[1].toUpperCase(),
      formId: namedMatch[2] ? parseInt(namedMatch[2], 10) : 0,
      type: 'named'
    };
  }
  
  // Pattern: NNNCry.ogg
  const cryMatch = name.match(/^(\d+)Cry$/i);
  if (cryMatch) {
    return {
      speciesId: parseInt(cryMatch[1], 10),
      formId: 0,
      type: 'cry'
    };
  }
  
  // Pattern: NAMEcry.wav
  const namedCryMatch = name.match(/^([A-Za-z]+)cry$/i);
  if (namedCryMatch) {
    return {
      speciesName: namedCryMatch[1].toUpperCase(),
      formId: 0,
      type: 'named-cry'
    };
  }
  
  return { raw: name, type: 'unknown' };
}

/**
 * Build asset index from a directory
 */
function buildAssetIndex(dirPath, extensions = ['.png', '.gif']) {
  const files = listFiles(dirPath, extensions);
  const index = new Map();
  
  for (const file of files) {
    const parsed = parseAssetFilename(file);
    let key;
    
    if (parsed.speciesId !== undefined) {
      key = `${parsed.speciesId}_${parsed.formId}`;
    } else if (parsed.speciesName) {
      key = `${parsed.speciesName}_${parsed.formId}`;
    } else {
      continue; // Skip unparseable files
    }
    
    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key).push({
      filename: file,
      path: join(dirPath, file),
      ...parsed
    });
  }
  
  return index;
}

/**
 * Generate candidate filenames for a species/form
 */
function generateCandidates(speciesId, formId, speciesName, type) {
  const candidates = [];
  
  // For numeric IDs
  if (typeof speciesId === 'number') {
    const padded3 = String(speciesId).padStart(3, '0');
    const padded4 = String(speciesId).padStart(4, '0');
    const bare = String(speciesId);
    
    if (formId === 0) {
      candidates.push(`${padded3}.png`, `${padded4}.png`, `${bare}.png`);
      candidates.push(`${padded3}.gif`, `${padded4}.gif`, `${bare}.gif`);
    } else {
      candidates.push(`${padded3}_${formId}.png`, `${padded4}_${formId}.png`, `${bare}_${formId}.png`);
      candidates.push(`${padded3}_${formId}.gif`, `${padded4}_${formId}.gif`, `${bare}_${formId}.gif`);
    }
  }
  
  // For named species
  if (speciesName) {
    const upper = speciesName.toUpperCase();
    const lower = speciesName.toLowerCase();
    const title = speciesName.charAt(0).toUpperCase() + speciesName.slice(1).toLowerCase();
    
    if (formId === 0) {
      candidates.push(`${upper}.png`, `${lower}.png`, `${title}.png`);
      candidates.push(`${upper}.gif`, `${lower}.gif`, `${title}.gif`);
    } else {
      candidates.push(`${upper}_${formId}.png`, `${lower}_${formId}.png`, `${title}_${formId}.png`);
      candidates.push(`${upper}_${formId}.gif`, `${lower}_${formId}.gif`, `${title}_${formId}.gif`);
    }
  }
  
  return candidates;
}

/**
 * Generate cry candidates
 */
function generateCryCandidates(speciesId, formId, speciesName) {
  const candidates = [];
  
  if (typeof speciesId === 'number') {
    const padded3 = String(speciesId).padStart(3, '0');
    const padded4 = String(speciesId).padStart(4, '0');
    const bare = String(speciesId);
    
    if (formId === 0) {
      candidates.push(`${bare}Cry.ogg`, `${padded3}Cry.ogg`, `${padded4}Cry.ogg`);
      candidates.push(`${bare}Cry.wav`, `${padded3}Cry.wav`, `${padded4}Cry.wav`);
    } else {
      candidates.push(`${bare}_${formId}Cry.ogg`, `${padded3}_${formId}Cry.ogg`);
      candidates.push(`${bare}_${formId}Cry.wav`, `${padded3}_${formId}Cry.wav`);
    }
  }
  
  if (speciesName) {
    const upper = speciesName.toUpperCase();
    const lower = speciesName.toLowerCase();

    candidates.push(`${upper}Cry.ogg`, `${lower}cry.ogg`);
    candidates.push(`${upper}Cry.wav`, `${lower}cry.wav`);
    candidates.push(`${upper}cry.wav`, `${lower}Cry.wav`);
    // Xenoverse uses bare named cries: VYELLOR.ogg (no "Cry" suffix)
    candidates.push(`${upper}.ogg`, `${lower}.ogg`);
    candidates.push(`${upper}.wav`, `${lower}.wav`);

    if (formId > 0) {
      candidates.push(`${upper}_${formId}Cry.ogg`, `${lower}_${formId}cry.ogg`);
      candidates.push(`${upper}_${formId}.ogg`, `${lower}_${formId}.ogg`);
    }
  }
  
  return candidates;
}

/**
 * Resolve assets for a species/form
 * @param {number|null} dexNumber - Regional dex number (Xenoverse uses 1300+)
 * @param {number|null} nationalDexNumber - National dex number for numeric sprite lookup
 */
function resolveAssets(speciesId, formId, speciesName, assetIndices, fileCache, dexNumber = null, nationalDexNumber = null) {
  const result = {
    speciesId,
    formId,
    speciesName,
    icon: { resolved: null, candidates: [], exists: false },
    front: { resolved: null, candidates: [], exists: false },
    frontShiny: { resolved: null, candidates: [], exists: false },
    back: { resolved: null, candidates: [], exists: false },
    backShiny: { resolved: null, candidates: [], exists: false },
    egg: { resolved: null, candidates: [], exists: false },
    cry: { resolved: null, candidates: [], exists: false }
  };
  
  // Helper to find asset
  const findAsset = (assetType, dirPath, candidates) => {
    result[assetType].candidates = candidates;
    
    for (const candidate of candidates) {
      const fullPath = join(REPO_ROOT, dirPath, candidate);
      if (fileCache.has(fullPath) || existsSync(fullPath)) {
        fileCache.add(fullPath);
        result[assetType].resolved = join(dirPath, candidate);
        result[assetType].exists = true;
        try {
          result[assetType].size = statSync(fullPath).size;
        } catch {}
        break;
      }
    }
  };
  
  // Generate candidates prioritizing named assets (which is what this game uses)
  // Also try national dex numbers for numeric sprites (022.png for Fearow, etc.)
  const generateNamedCandidates = (name, form, ext = '.png') => {
    const candidates = [];
    const exts = [ext, ext.toUpperCase()]; // cover .png and .PNG (upstream uses both)
    if (name) {
      const upper = name.toUpperCase();
      const lower = name.toLowerCase();
      const title = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      const names = [upper, title, lower];
      if (form === 0) {
        for (const n of names) for (const e of exts) candidates.push(`${n}${e}`);
      } else {
        for (const n of names) {
          for (const e of exts) candidates.push(`${n}_${form}${e}`);
          for (const e of exts) candidates.push(`${n}${e}`); // Fallback to base form
        }
      }
    }
    // Try national dex number (for numeric sprite files like 022.png)
    if (nationalDexNumber !== null) {
      const padded3 = String(nationalDexNumber).padStart(3, '0');
      if (form === 0) {
        candidates.push(`${padded3}${ext}`, `${nationalDexNumber}${ext}`);
      } else {
        candidates.push(`${padded3}_${form}${ext}`, `${nationalDexNumber}_${form}${ext}`);
      }
    }
    // Also try regional dex number if we have it
    if (dexNumber !== null && dexNumber !== nationalDexNumber) {
      const padded3 = String(dexNumber).padStart(3, '0');
      if (form === 0) {
        candidates.push(`${padded3}${ext}`, `${dexNumber}${ext}`);
      } else {
        candidates.push(`${padded3}_${form}${ext}`, `${dexNumber}_${form}${ext}`);
      }
    }
    return candidates;
  };
  
  // Check each asset type with named priority
  findAsset('icon', ASSET_PATHS.icons, 
    generateNamedCandidates(speciesName, formId));
  
  findAsset('front', ASSET_PATHS.front,
    generateNamedCandidates(speciesName, formId));
  
  findAsset('frontShiny', ASSET_PATHS.frontShiny,
    generateNamedCandidates(speciesName, formId));
  
  findAsset('back', ASSET_PATHS.back,
    generateNamedCandidates(speciesName, formId));
  
  findAsset('backShiny', ASSET_PATHS.backShiny,
    generateNamedCandidates(speciesName, formId));
  
  // Check both egg directories
  findAsset('egg', ASSET_PATHS.eggs, generateNamedCandidates(speciesName, formId));
  if (!result.egg.exists) {
    findAsset('egg', ASSET_PATHS.eggsEBDX, generateNamedCandidates(speciesName, formId));
  }
  
  // Check cries - use numeric IDs (game uses dex numbers for cries)
  const cryCandidates = [];
  if (dexNumber !== null) {
    cryCandidates.push(`${dexNumber}Cry.ogg`, `${dexNumber}Cry.wav`);
    if (formId > 0) {
      cryCandidates.push(`${dexNumber}_${formId}Cry.ogg`);
    }
  }
  // Also try named cries
  if (speciesName) {
    cryCandidates.push(`${speciesName.toUpperCase()}Cry.ogg`);
    cryCandidates.push(`${speciesName.toLowerCase()}cry.wav`);
    cryCandidates.push(`${speciesName}cry.wav`);
    // Xenoverse uses bare named cries: VYELLOR.ogg (no "Cry" suffix)
    cryCandidates.push(`${speciesName.toUpperCase()}.ogg`);
    cryCandidates.push(`${speciesName.toLowerCase()}.ogg`);
    cryCandidates.push(`${speciesName.toUpperCase()}.wav`);
    cryCandidates.push(`${speciesName.toLowerCase()}.wav`);
    if (formId > 0) {
      cryCandidates.push(`${speciesName.toUpperCase()}_${formId}.ogg`);
      cryCandidates.push(`${speciesName.toLowerCase()}_${formId}.ogg`);
    }
  }
  findAsset('cry', ASSET_PATHS.cries, cryCandidates);
  
  return result;
}

/**
 * Main asset resolution
 */
async function resolveAllAssets() {
  console.log('Starting asset resolution...\n');
  const startTime = Date.now();
  
  // Load species data
  const speciesPath = join(OUT_DIR, 'species.json');
  if (!existsSync(speciesPath)) {
    console.error('Error: species.json not found. Run export first.');
    process.exit(1);
  }
  
  const speciesData = JSON.parse(readFileSync(speciesPath, 'utf8'));
  console.log(`Loaded ${speciesData.meta.count} species entries\n`);
  
  // Build dex number map for cry resolution
  const dexMap = buildDexNumberMap();
  
  // Build national dex number map based on species order
  // Gen 1-8 Pokemon follow national dex order in species.json
  const nationalDexMap = new Map();
  const baseFormSpecies = speciesData.data.filter(s => s.formId === 0);
  baseFormSpecies.forEach((s, index) => {
    // Only map the first ~898 species (national dex range)
    if (index < 898) {
      nationalDexMap.set(s.id, index + 1);
    }
  });
  console.log(`Built national dex map: ${nationalDexMap.size} species\n`);
  
  // Scan asset directories
  console.log('Scanning asset directories...');
  for (const [name, path] of Object.entries(ASSET_PATHS)) {
    const fullPath = join(REPO_ROOT, path);
    const exists = existsSync(fullPath);
    const count = exists ? listFiles(path).length : 0;
    console.log(`  ${name}: ${path} ${exists ? `(${count} files)` : '(not found)'}`);
  }
  console.log('');
  
  // Build file cache for performance
  const fileCache = new Set();
  const assetIndices = {};
  
  // Resolve assets for each species
  const manifest = [];
  const missing = {
    icon: [],
    front: [],
    frontShiny: [],
    back: [],
    backShiny: [],
    egg: [],
    cry: []
  };
  
  let processed = 0;
  for (const species of speciesData.data) {
    // Get regional dex number for this species (for cry resolution)
    const dexNumber = dexMap.get(species.species);
    // Get national dex number for numeric sprite lookup (022.png for Fearow, etc.)
    const nationalDexNumber = nationalDexMap.get(species.id);
    
    const assets = resolveAssets(
      species.id,
      species.formId,
      species.species,
      assetIndices,
      fileCache,
      dexNumber,
      nationalDexNumber
    );
    
    // Add to manifest
    manifest.push({
      speciesId: species.id,
      formId: species.formId,
      name: species.name,
      dexNumber: dexNumber || null,
      nationalDexNumber: nationalDexNumber || null,
      assets: {
        icon: assets.icon.resolved,
        front: assets.front.resolved,
        frontShiny: assets.frontShiny.resolved,
        back: assets.back.resolved,
        backShiny: assets.backShiny.resolved,
        egg: assets.egg.resolved,
        cry: assets.cry.resolved
      },
      _debug: {
        iconCandidates: assets.icon.candidates.slice(0, 3),
        frontCandidates: assets.front.candidates.slice(0, 3),
        cryCandidates: assets.cry.candidates.slice(0, 3)
      }
    });
    
    // Track missing
    for (const assetType of Object.keys(missing)) {
      if (!assets[assetType].exists) {
        missing[assetType].push({
          speciesId: species.id,
          formId: species.formId,
          name: species.name,
          dexNumber: dexNumber || null,
          candidates: assets[assetType].candidates.slice(0, 5)
        });
      }
    }
    
    processed++;
    if (processed % 500 === 0) {
      console.log(`  Processed ${processed}/${speciesData.data.length} species...`);
    }
  }
  
  // Calculate coverage
  const totalSpecies = speciesData.data.length;
  const coverage = {
    icon: ((totalSpecies - missing.icon.length) / totalSpecies * 100).toFixed(1),
    front: ((totalSpecies - missing.front.length) / totalSpecies * 100).toFixed(1),
    frontShiny: ((totalSpecies - missing.frontShiny.length) / totalSpecies * 100).toFixed(1),
    back: ((totalSpecies - missing.back.length) / totalSpecies * 100).toFixed(1),
    backShiny: ((totalSpecies - missing.backShiny.length) / totalSpecies * 100).toFixed(1),
    egg: ((totalSpecies - missing.egg.length) / totalSpecies * 100).toFixed(1),
    cry: ((totalSpecies - missing.cry.length) / totalSpecies * 100).toFixed(1)
  };
  
  console.log('\nAsset coverage:');
  for (const [type, pct] of Object.entries(coverage)) {
    const missingCount = missing[type].length;
    console.log(`  ${type}: ${pct}% (${totalSpecies - missingCount}/${totalSpecies})`);
  }
  
  // Write manifest
  const manifestPath = join(OUT_DIR, 'assets_manifest.json');
  const manifestData = {
    meta: {
      exportTime: new Date().toISOString(),
      speciesCount: totalSpecies,
      coverage,
      missingCounts: {
        icon: missing.icon.length,
        front: missing.front.length,
        frontShiny: missing.frontShiny.length,
        back: missing.back.length,
        backShiny: missing.backShiny.length,
        egg: missing.egg.length,
        cry: missing.cry.length
      }
    },
    assets: manifest
  };
  
  writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
  console.log(`\nWrote ${manifestPath}`);
  
  // Generate missing assets report
  const reportLines = [
    '# Missing Assets Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Total species: ${totalSpecies}`,
    '',
    '## Summary',
    '',
    '| Asset Type | Coverage | Missing |',
    '|------------|----------|---------|'
  ];
  
  for (const [type, pct] of Object.entries(coverage)) {
    reportLines.push(`| ${type} | ${pct}% | ${missing[type].length} |`);
  }
  
  reportLines.push('');
  
  for (const [type, entries] of Object.entries(missing)) {
    if (entries.length === 0) continue;
    
    reportLines.push(`## Missing ${type} (${entries.length})`);
    reportLines.push('');
    
    // Group by pattern
    const byFolder = new Map();
    for (const entry of entries.slice(0, 50)) {
      const formNote = entry.formId > 0 ? ` (form ${entry.formId})` : '';
      reportLines.push(`- ${entry.name}${formNote} (${entry.speciesId})`);
    }
    
    if (entries.length > 50) {
      reportLines.push(`- ... and ${entries.length - 50} more`);
    }
    
    reportLines.push('');
  }
  
  const reportPath = join(OUT_DIR, 'missing_assets_report.md');
  writeFileSync(reportPath, reportLines.join('\n'));
  console.log(`Wrote ${reportPath}`);
  
  const duration = Date.now() - startTime;
  console.log(`\nAsset resolution completed in ${duration}ms`);
  
  return { success: true, coverage, missing };
}

// Run
resolveAllAssets().catch(console.error);
