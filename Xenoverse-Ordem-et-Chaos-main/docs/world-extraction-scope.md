# World Extraction Scope

## Phase 1 — Supported Event Patterns

### 1. Give Item (Ground Items)
- **Event Command**: `pbReceiveItem(ITEM_ID)` or similar
- **Confidence**: HIGH when item ID matches items.dat
- **Provenance**: map_id, event_id, page_index, command_index

### 2. Hidden Item
- **Event Command**: Same as give item but with hidden flag/comment
- **Confidence**: MEDIUM (detection may miss some)
- **Provenance**: Full event location

### 3. Trainer Battle
- **Event Command**: `pbTrainerBattle(:TRAINER_TYPE, "Name")` or similar
- **Confidence**: HIGH when trainer matches trainers.dat
- **Provenance**: Full event location + battle conditions

### 4. Shop Inventory
- **Event Command**: `pbPokemonMart([item_list])` or similar
- **Confidence**: HIGH when all items match items.dat
- **Provenance**: Full event location

## Data Sources

| Source | Format | Count | Status |
|--------|--------|-------|--------|
| items.dat | Marshal 4.8 | 863 | Ready |
| trainers.dat | Marshal 4.8 | 159 | Ready |
| trainer_types.dat | Marshal 4.8 | TBD | Ready |
| Map###.rxdata | Marshal 4.8 | 293 | Ready |
| MapInfos.rxdata | Marshal 4.8 | 1 | Ready |

## NOT Attempted (Phase 1)

- Quest-conditional item grants
- Complex story branch items
- Mystery gift items
- Dynamically generated trainer battles
- Conditional shop inventories (story-dependent)
- Time-of-day locked encounters
- Weather-dependent spawns
- Points of Interest with multiple item sources

All unsupported patterns will be logged in diagnostics with counts.

## Layer Separation

### Layer A (Canonical)
- items.json, trainers.json
- Deterministic, extracted from .dat files
- Validation: ERROR-level failures

### Layer B (Derived/Best-Effort)
- world_facts.json, world_extraction_report.md
- Provenance + confidence required
- Validation: WARNING-level (does not fail build)

## Output Artifacts

```
out/builds/<build_id>/
├── items.json
├── trainers.json
├── world_facts.json
└── world_extraction_report.md
```
