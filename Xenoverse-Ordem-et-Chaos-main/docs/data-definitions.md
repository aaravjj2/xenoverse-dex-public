# Data Definitions

This document defines the canonical terminology and counting rules for species entries in the Xenoverse Pokédex.

## Species Entry Types

### Base Species
- **Definition**: A species entry where `form_id = 0`
- **Identification**: `species_id` only (e.g., `BULBASAUR`, `TRISHOUT`)
- **Counting**: Each unique `species_id` with `form_id = 0` is counted once
- **Database Query**: 
  ```sql
  SELECT COUNT(*) FROM species WHERE form_id = 0 AND is_dev = 0
  ```

### Form Entry
- **Definition**: A species entry representing an alternate form (mega, regional, Xenoversal, etc.)
- **Identification**: `species_id` with `form_id > 0` (e.g., `TRISHOUT_2` with `form_id = 2`)
- **Xenoverse Form Types**:
  - `form_id = 0`: Base Form
  - `form_id = 1`: Terrestrial Form
  - `form_id = 2`: Xenoversal Form
  - `form_id = 3`: Astral Form
- **Counting**: Each unique `(species_id, form_id)` pair where `form_id > 0`
- **Database Query**:
  ```sql
  SELECT COUNT(*) FROM species WHERE form_id > 0 AND is_dev = 0
  ```

### Dev/Placeholder Entry
- **Definition**: An incomplete or work-in-progress entry not intended for player viewing
- **Identification**: Flagged via `is_dev = 1` column
- **Classification Criteria** (any match):
  1. `name` matches placeholder patterns: `WIP`, `TEST`, `PLACEHOLDER`, `TODO`, `TEMP`
  2. `bst` (Base Stat Total) < 50 (abnormally low, likely placeholder)
  3. All base stats equal to 1 (bst = 6)
  4. Missing required display name
- **Counting**: Hidden from default views, shown only in diagnostic mode
- **Database Query**:
  ```sql
  SELECT COUNT(*) FROM species WHERE is_dev = 1
  ```

## Counting Summary

| Metric | Definition | Visibility |
|--------|------------|------------|
| **Base Species** | Unique species_id where form_id=0 and is_dev=0 | Default list, header |
| **Total Forms** | All entries where form_id>0 and is_dev=0 | Forms tab, diagnostics |
| **Total Entries** | All species + forms where is_dev=0 | Diagnostics |
| **Dev Entries** | All entries where is_dev=1 | Diagnostics only (hidden by default) |

## Consistency Rules

1. **UI Header Counts**: Must match `SELECT COUNT(*) FROM species WHERE form_id = 0 AND is_dev = 0`
2. **Diagnostics Page**: Must show all four counts (base, forms, total, dev)
3. **Filter Toggles**: "Show all forms" includes form_id>0; "Show dev entries" includes is_dev=1
4. **API Default**: Unless explicitly requested, API endpoints filter `is_dev = 0`

## Inheritance Rules

### Learnset Inheritance
- Forms (`form_id > 0`) may have their own learnsets OR inherit from base (`form_id = 0`)
- Inheritance check: If form has no learnset entries, return base learnset with `learnset_source = 'base'`
- API response includes: `learnset_source: 'form' | 'base' | 'none'`

### Asset Inheritance
- Forms may have their own sprites/cries OR fall back to base form assets
- Priority: Form asset > Base asset > Missing placeholder
- API response includes: `asset_source: 'form' | 'base' | 'missing'` for each asset type

## Move Data Canonicality

### Single Source of Truth
- The `moves` table is the **only** canonical source for move properties
- Learnset records reference moves by `move_id` only (no duplicate category/power/type)
- All move displays (learnset tables, move lists) must join to canonical moves table

### Variable Power Display
- Moves with `is_variable_power = 1` display `power_display = 'Varies'` (never numeric)
- Affected moves: Return, Frustration, Low Kick, Grass Knot, etc.

### Category Values
- Valid categories: `Physical`, `Special`, `Status`
- Invalid/missing shows: `—` or `Unknown`
