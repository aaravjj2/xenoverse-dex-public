#!/usr/bin/env node
/**
 * Copy the latest Mac game payload into this project and rebuild the Dex DB.
 *
 * Usage:
 *   npm run update:mac -- --source "../Xenoverse-Ordem-et-Chaos-Mac"
 *   npm run update:mac -- --source "../Xenoverse eX.app"
 *   npm run update:mac -- --source "../Xenoverse-Ordem-et-Chaos-Mac" --data-only
 *
 * This script does not fetch GitHub itself. Clone/download the Mac repo first.
 */

import { existsSync, mkdirSync, cpSync, renameSync, writeFileSync, copyFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../..');

const REQUIRED = ['species.dat', 'moves.dat', 'types.dat', 'abilities.dat', 'regional_dexes.dat', 'MapInfos.rxdata'];
const OPTIONAL = ['encounters.dat', 'items.dat', 'trainers.dat', 'Scripts.rxdata'];

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function usage() {
  console.log(`Usage:
  npm run update:mac -- --source "../Xenoverse-Ordem-et-Chaos-Mac"
  npm run update:mac -- --source "../Xenoverse eX.app"

Options:
  --source <path>   Required. Mac repo checkout, .app bundle, Contents/Game, or Game folder.
  --data-only       Copy Data/ only. Leave Graphics/ and Audio/ unchanged.
  --no-rebuild      Copy payload only. Skip npm run rebuild and validation.
  --dry-run         Validate source paths only. Do not move files.
`);
}

function argValue(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  if (i + 1 >= args.length) throw new Error(`Missing value for ${name}`);
  return args[i + 1];
}

function run(cmd, args) {
  const exe = process.platform === 'win32' && cmd === 'npm' ? 'npm.cmd' : cmd;
  console.log(`$ ${[cmd, ...args].join(' ')}`);
  const result = spawnSync(exe, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${cmd} failed with exit code ${result.status}`);
}

function findGameRoot(source) {
  const s = resolve(source);
  const candidates = [
    s,
    join(s, 'Xenoverse eX.app', 'Contents', 'Game'),
    join(s, 'Contents', 'Game'),
    join(s, 'Game')
  ];

  for (const c of candidates) {
    if (existsSync(join(c, 'Data', 'species.dat'))) return c;
  }

  throw new Error(`Could not find game Data/species.dat under: ${s}`);
}

function validateData(dataDir) {
  const missing = REQUIRED.filter((f) => !existsSync(join(dataDir, f)));
  if (missing.length) throw new Error(`Missing required Data files: ${missing.join(', ')}`);
  return OPTIONAL.filter((f) => existsSync(join(dataDir, f)));
}

function stage(gameRoot, dirs, id) {
  const stageRoot = join(ROOT, '.cache', 'update-from-mac', id, 'stage');
  mkdirSync(stageRoot, { recursive: true });

  for (const d of dirs) {
    const src = join(gameRoot, d);
    if (!existsSync(src)) {
      console.log(`Skipping missing upstream ${d}/`);
      continue;
    }
    console.log(`Staging ${d}/`);
    cpSync(src, join(stageRoot, d), { recursive: true, force: true, preserveTimestamps: true });
  }

  validateData(join(stageRoot, 'Data'));
  return stageRoot;
}

function moveExistingToBackup(dirs, id) {
  const backupRoot = join(ROOT, '.cache', 'update-from-mac', id, 'backup');
  mkdirSync(backupRoot, { recursive: true });

  for (const d of dirs) {
    const target = join(ROOT, d);
    if (existsSync(target)) {
      console.log(`Backing up existing ${d}/`);
      renameSync(target, join(backupRoot, d));
    }
  }

  for (const f of ['out/dex.db', 'apps/dex/dex.db']) {
    const src = join(ROOT, f);
    if (existsSync(src)) {
      mkdirSync(dirname(join(backupRoot, f)), { recursive: true });
      copyFileSync(src, join(backupRoot, f));
    }
  }

  return backupRoot;
}

function applyStage(stageRoot, dirs) {
  for (const d of dirs) {
    const staged = join(stageRoot, d);
    if (!existsSync(staged)) continue;
    console.log(`Applying ${d}/`);
    renameSync(staged, join(ROOT, d));
  }
}

function writeMeta(gameRoot, dirs, optionalPresent) {
  const meta = {
    updatedAt: new Date().toISOString(),
    sourceGameRoot: gameRoot,
    copiedDirs: dirs,
    requiredDataFiles: REQUIRED,
    optionalDataFilesPresent: optionalPresent
  };
  writeFileSync(join(ROOT, 'Data', '.source_update.json'), JSON.stringify(meta, null, 2));
  return meta;
}

function verifyDb() {
  const code = `
const Database = require('better-sqlite3');
const db = new Database('./out/dex.db', { readonly: true });
console.log('integrity_check:', db.pragma('integrity_check')[0].integrity_check);
for (const t of ['species','moves','types','abilities','evolutions','learnsets','assets','encounters','items','trainers','trainer_party','world_facts']) {
  try { console.log(t + ':', db.prepare('SELECT COUNT(*) c FROM ' + t).get().c); }
  catch { console.log(t + ': missing'); }
}
db.close();`;
  run('node', ['-e', code]);
  if (existsSync(join(ROOT, 'out', 'dex.db'))) {
    copyFileSync(join(ROOT, 'out', 'dex.db'), join(ROOT, 'apps', 'dex', 'dex.db'));
    console.log('Copied out/dex.db -> apps/dex/dex.db');
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    usage();
    return;
  }

  const source = argValue(args, '--source');
  if (!source) throw new Error('Missing --source. Clone/download the Mac repo first.');

  const dataOnly = args.includes('--data-only');
  const noRebuild = args.includes('--no-rebuild');
  const dryRun = args.includes('--dry-run');
  const dirs = dataOnly ? ['Data'] : ['Data', 'Graphics', 'Audio'];
  const id = stamp();

  const gameRoot = findGameRoot(source);
  const optionalPresent = validateData(join(gameRoot, 'Data'));

  console.log(`Project root: ${ROOT}`);
  console.log(`Source game root: ${gameRoot}`);
  console.log(`Dirs to copy: ${dirs.join(', ')}`);
  console.log(`Optional data present: ${optionalPresent.join(', ') || 'none'}`);

  if (dryRun) return;

  const stageRoot = stage(gameRoot, dirs, id);
  const backupRoot = moveExistingToBackup(dirs, id);
  applyStage(stageRoot, dirs);
  writeMeta(gameRoot, dirs, optionalPresent);
  console.log(`Backup root: ${backupRoot}`);

  if (!noRebuild) {
    run('npm', ['run', 'rebuild']);
    run('npm', ['run', 'validate:data']);
    verifyDb();
  } else {
    console.log('Skipped rebuild. Run npm run rebuild before using out/dex.db.');
  }
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
