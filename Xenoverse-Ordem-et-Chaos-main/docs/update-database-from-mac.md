# Updating the Xenoverse Dex database from the Mac release

Bottom line: do not edit `out/dex.db` by hand. Replace the upstream game payload, run the existing export/assets/ingest pipeline, then verify the rebuilt SQLite database.

## Source repo analyzed

Upstream Mac repo:

```txt
https://github.com/Ghasty001/Xenoverse-Ordem-et-Chaos-Mac
```

The game payload lives under:

```txt
Xenoverse eX.app/Contents/Game
```

The upstream `Game.ini` points scripts to `Data\Scripts.rxdata`, so the canonical game data folder is `Xenoverse eX.app/Contents/Game/Data`.

## Your database pipeline

Your project already uses this sequence:

```bash
npm run rebuild
```

That runs:

```bash
npm run export
npm run assets
npm run ingest
npm run relationships
```

The SQLite database is generated at:

```txt
out/dex.db
```

For the Next.js app, also copy it to:

```txt
apps/dex/dex.db
```

## Safe update process

From `Xenoverse-Ordem-et-Chaos-main/`:

```bash
# 1. Keep a local backup of the old generated DB.
mkdir -p .cache/update-backups/manual
cp out/dex.db .cache/update-backups/manual/dex.db 2>/dev/null || true
cp apps/dex/dex.db .cache/update-backups/manual/app-dex.db 2>/dev/null || true

# 2. Clone or update the Mac repo somewhere outside the project.
git clone --depth 1 https://github.com/Ghasty001/Xenoverse-Ordem-et-Chaos-Mac.git ../Xenoverse-Ordem-et-Chaos-Mac

# 3. Replace game data.
rm -rf Data
cp -R "../Xenoverse-Ordem-et-Chaos-Mac/Xenoverse eX.app/Contents/Game/Data" Data

# 4. Replace assets if you want updated sprite/audio coverage too.
rm -rf Graphics Audio
cp -R "../Xenoverse-Ordem-et-Chaos-Mac/Xenoverse eX.app/Contents/Game/Graphics" Graphics
cp -R "../Xenoverse-Ordem-et-Chaos-Mac/Xenoverse eX.app/Contents/Game/Audio" Audio

# 5. Rebuild generated JSON, asset manifest, SQLite DB, and relationships.
npm run rebuild

# 6. Validate data.
npm run validate:data

# 7. Verify SQLite integrity and table counts.
node -e "const Database=require('better-sqlite3'); const db=new Database('./out/dex.db',{readonly:true}); console.log(db.pragma('integrity_check')); for (const t of ['species','moves','types','abilities','evolutions','learnsets','assets','encounters','items','trainers','trainer_party','world_facts']) { try { console.log(t, db.prepare('SELECT COUNT(*) c FROM '+t).get().c); } catch { console.log(t, 'missing'); } } db.close();"

# 8. Update app copy of the DB.
cp out/dex.db apps/dex/dex.db
```

## Required files before rebuild

The export pipeline expects these in `Data/`:

```txt
species.dat
moves.dat
types.dat
abilities.dat
regional_dexes.dat
MapInfos.rxdata
```

Additional data imported when present:

```txt
encounters.dat
items.dat
trainers.dat
Scripts.rxdata
```

## What to review before committing

Review these first:

```bash
git status
git diff --stat
npm run validate:data
```

Do not commit `.cache/`. Commit generated artifacts only if this repo intentionally stores generated output. Your current repo does store `out/` artifacts, so database/output changes may be expected, but they should be reviewed by count deltas first.
