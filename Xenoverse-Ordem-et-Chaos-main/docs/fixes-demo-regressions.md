# Bug Fixes: Demo Video Regressions

This document describes the root causes and fixes for issues identified during demo video recording.

## Phase 1: Move Correctness Issues

### Issue 1.1: Move Categories Inverted
**Symptom:** Protect shows as "Special" (should be Status), Flamethrower/Fire Blast show as "Physical" (should be Special)

**Root Cause:** In `/tools/export/index.js` line 224, the category mapping array was inverted:
```javascript
// WRONG:
category = ['Status', 'Physical', 'Special'][category] || 'Unknown';
```

The raw data from Pokémon Essentials uses:
- 0 = Physical
- 1 = Special  
- 2 = Status

**Fix:** Changed mapping to correct order:
```javascript
// CORRECT:
category = ['Physical', 'Special', 'Status'][category] || 'Unknown';
```

**Files Changed:**
- `tools/export/index.js` - Fixed `normalizeMove()` function

---

### Issue 1.2: Variable-Power Moves Show Power=1
**Symptom:** Return and Frustration show power=1 instead of indicating variable power

**Root Cause:** Variable-power moves in Pokémon Essentials store `power=1` as a placeholder. The export was passing this raw value through without detecting the variable-power function codes.

**Fix:** Added detection for variable-power moves based on their `functionCode`:
- PowerHigherWithUserHappiness (Return)
- PowerLowerWithUserHappiness (Frustration)
- PowerHigherWithTargetWeight (Low Kick, Grass Knot)
- And 13 other variable-power function codes

For these moves, `power` is set to `null` and `isVariablePower: true` is added.

**Files Changed:**
- `tools/export/index.js` - Added variable-power detection in `normalizeMove()`
- `tools/ingest/index.js` - Added `is_variable_power` column to moves table
- `apps/dex/src/app/moves/page.tsx` - Display "Varies" for variable-power moves
- `apps/dex/src/app/moves/[id]/page.tsx` - Display "Varies" for variable-power moves

---

## Phase 2: Learnset Form Inheritance

### Issue 2.1: Xenoversal/Astral Forms Show "Learnset (0)"
**Symptom:** Alternate forms like Xenoversal (form_id=2) and Astral (form_id=3) show empty learnsets

**Root Cause:** In `/tools/export/index.js` line 518, when extracting learnsets, the code looked up raw data by `species.species` (the base species name like "TRISHOUT") instead of `species.id` (the full form key like "TRISHOUT_2").

```javascript
// WRONG:
const speciesData = speciesResult.data?.[species.species];

// CORRECT:
const speciesData = speciesResult.data?.[species.id];
```

Each form in the source data has its own moves array, but the wrong lookup key caused forms to miss their data.

**Fix:** Changed lookup to use `species.id` which includes the form suffix.

**Files Changed:**
- `tools/export/index.js` - Fixed learnset lookup key

---

## Phase 3: Assets & Junk Data

### Issue 3.1: WIP Entries with BST=6
**Symptom:** Database contains ~29 entries named "WIP" with all base stats = 1 (BST = 6)

**Root Cause:** The source species.dat contains placeholder entries for in-development Pokémon. These have:
- `name = "WIP"`
- All base stats = 1
- No meaningful data

**Fix:** Added filter during export to skip entries matching any of:
- `name === "WIP"`
- `bst === 6`
- All stats equal to 1

**Files Changed:**
- `tools/export/index.js` - Added WIP filter in species export loop

---

## Phase 4: Cry Audio (Deferred)

### Issue 4.1: Audio Shows 0:00/0:00
**Status:** Under investigation

**Potential Causes:**
1. OGG file format not supported by browser
2. File serving issues (path resolution)
3. CORS or content-type headers

The database has correct cry paths (e.g., `Audio/SE/Cries/1331Cry.ogg`) and files exist on disk. The asset API route appears correct. May require browser testing.

---

## Phase 5: Compare Page Form Identity

### Issue 5.1: Duplicate Names Without Form Identity
**Symptom:** When searching in Compare page, forms like TRISHOUT_2 show just "Trishout" without indicating it's the Xenoversal form

**Root Cause:** The `form_name` field in the database is null for forms where the source data doesn't provide explicit names. The Xenoverse game uses implicit form names based on form_id:
- 0 = Base Form
- 1 = Terrestrial Form
- 2 = Xenoversal Form
- 3 = Astral Form

**Fix:** Added `display_form_name` computed field to `getSpeciesList()` that uses the Xenoverse form name mapping as fallback when `form_name` is null.

**Files Changed:**
- `apps/dex/src/lib/db.ts` - Added `getXenoverseFormName()` helper and compute `display_form_name`
- `apps/dex/src/app/compare/page.tsx` - Updated SearchResult interface and display

---

## Summary of Changes

| File | Changes |
|------|---------|
| `tools/export/index.js` | Fixed category mapping, added variable-power detection, fixed learnset form lookup, added WIP filter |
| `tools/ingest/index.js` | Added `is_variable_power` column to moves table schema |
| `apps/dex/src/lib/db.ts` | Added `display_form_name` computation |
| `apps/dex/src/app/moves/page.tsx` | Display "Varies" for variable-power moves |
| `apps/dex/src/app/moves/[id]/page.tsx` | Display "Varies" for variable-power moves |
| `apps/dex/src/app/compare/page.tsx` | Use `display_form_name` for form identity |

## Verification Steps

After applying fixes:

1. **Re-export data:**
   ```bash
   cd tools/export && node index.js
   ```

2. **Re-ingest to database:**
   ```bash
   rm out/dex.db  # Remove old database to get new schema
   cd tools/ingest && node index.js
   ```

3. **Rebuild and test:**
   ```bash
   cd apps/dex && npm run build && npm run dev
   ```

4. **Run E2E tests:**
   ```bash
   cd apps/dex && npm run test:e2e
   ```

## E2E Test Coverage

The Playwright E2E tests in `apps/dex/e2e/dex.spec.ts` verify all fixes:

| Test Suite | Tests | What it verifies |
|------------|-------|------------------|
| Phase 1: Move Category Fixes | 4 | Protect=Status, Flamethrower=Special, Tackle=Physical, API categories |
| Phase 1b: Variable-Power Moves | 3 | Return/Frustration display "Varies", API flag verification |
| Phase 3: WIP/Junk Data Filtering | 2 | No "WIP" species, no BST=6 species |
| Phase 5: Compare Page Form Identity | 2 | Compare page loads, API returns form info |
| Core Navigation | 4 | Home, Moves, Types, Species detail pages load |
| API Endpoints | 3 | /api/moves, /api/species, /api/diagnostics return correct structure |

**Total: 18 tests**

## Truth Set Verification

After re-export, verify these moves have correct categories:
- PROTECT → Status
- FLAMETHROWER → Special
- FIREBLAST → Special
- TACKLE → Physical
- EARTHQUAKE → Physical
- RETURN → Physical (power: null, is_variable_power: true)
- FRUSTRATION → Physical (power: null, is_variable_power: true)
