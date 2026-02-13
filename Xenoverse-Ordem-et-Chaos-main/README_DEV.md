# Developer Documentation

This document describes the development setup, pipeline commands, and architecture of the Xenoverse Dex project.

## Project Architecture

### Directory Structure

```
Xenoverse-Ordem-et-Chaos-main/
├── Data/                    # Game data files (.dat Ruby Marshal format)
├── Graphics/                # Game graphics (sprites, icons, etc.)
│   ├── EBDX/Battlers/       # Animated sprite sheets (Front, Back, Shiny variants)
│   └── Pokemon/Icons/       # Static icon sprites
├── Audio/                   # Game audio files
│   └── SE/Cries/           # Pokémon cry sound files
├── tools/                   # Data pipeline tools
│   ├── export/             # Decode .dat files → JSON
│   ├── assets/             # Scan Graphics/Audio → manifest
│   ├── ingest/             # JSON + manifest → SQLite
│   ├── build.js            # Versioned build system
│   ├── diff.js             # Build comparison & changelog
│   ├── validate.js         # Data validation suite
│   ├── validate-assets.js  # Asset correctness checks
│   ├── relationships.js    # Relationship indices
│   ├── query.js            # Query DSL
│   ├── formats.js          # Multi-format export (CSV, TS, Showdown)
│   └── analytics.js        # Statistics & insights
├── apps/dex/               # Next.js web application
│   └── src/
│       ├── app/            # App Router pages & API routes
│       ├── components/     # React components
│       └── lib/            # Database queries
├── out/                    # Build outputs
│   ├── *.json              # Exported JSON data
│   ├── dex.db              # SQLite database
│   └── assets_manifest.json
└── package.json            # Root package with pipeline scripts
```

### Pipeline Components

| Component | Location | Purpose |
|-----------|----------|---------|
| **Exporter** | `tools/export/index.js` | Decodes Ruby Marshal `.dat` files to normalized JSON |
| **Assets Resolver** | `tools/assets/index.js` | Scans Graphics/Audio folders, resolves asset paths |
| **Ingester** | `tools/ingest/index.js` | Loads JSON into SQLite database |
| **API** | `apps/dex/src/app/api/` | REST endpoints for species, moves, assets |
| **UI** | `apps/dex/src/app/` | Next.js pages (Pokédex, Moves, Diagnostics) |

## Commands

### Golden End-to-End Sequence

```bash
# Full rebuild: export → assets → ingest → relationships
npm run rebuild

# Versioned build with timestamps and hashes
npm run rebuild:versioned

# Start development server (port 3001)
npm run dev

# Run all tests
npm run test:all

# Individual steps
npm run export        # Export .dat files to JSON
npm run assets        # Scan and resolve asset paths
npm run ingest        # Populate SQLite from JSON
npm run relationships # Build relationship indices
```

### Validation & Quality

```bash
# Validate data integrity
npm run validate:data

# View validation report
cat out/validation_report.md
```

### Export Formats

```bash
# Export all formats (JSON, CSV, TypeScript, Showdown, SQL)
node tools/formats.js all

# Single format
node tools/formats.js csv
node tools/formats.js typescript
node tools/formats.js showdown
```

### Analytics

```bash
# Generate analytics report
node tools/analytics.js

# View analytics
cat out/analytics/analytics.md
```

### Query DSL Demo

```bash
# Run query examples
node tools/query.js
```

### Development

```bash
# Start dev server
npm run dev

# Run unit tests
npm run test

# Run Playwright E2E tests
npm run test:e2e

# Lint and format
npm run lint
npm run format
```

## Baseline Metrics (Current Build)

| Entity | Count |
|--------|-------|
| Species (with forms) | 1,593 |
| Unique Species IDs | 1,593 |
| Moves | 932 |
| Types | 20 |
| Abilities | 347 |
| Evolutions | 1,328 |
| Learnset Entries | 116,114 |
| Asset Records | 1,593 |

### Asset Coverage

| Asset Type | Count | Coverage |
|------------|-------|----------|
| Icons | 924 | 58.0% |
| Front Sprites | 1,259 | 79.0% |
| Front Shiny | 1,469 | 92.2% |
| Cries | 264 | 16.6% |

## EBDX Sprite Format

EBDX (Elite Battle DX) uses **horizontal sprite sheets** for animations:
- Height = frame size (each frame is square)
- Width = frame_size × num_frames
- The `SpriteDisplay` component extracts the first frame using Canvas

Example: `KOTORA.png` is 8832×96 → 92 frames of 96×96 pixels

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/species` | List species with filters (search, types, BST, etc.) |
| `GET /api/species/[id]` | Species detail with evolutions and learnset |
| `GET /api/moves` | List all moves |
| `GET /api/asset?path=...` | Serve static assets from Graphics/Audio |

## Database Schema

See `tools/ingest/index.js` for full schema. Key tables:
- `species` - Base stats, types, abilities
- `moves` - Power, accuracy, PP, category
- `evolutions` - target_species, method, parameter
- `learnsets` - move_id, learn_method, level
- `assets` - Resolved paths for each species/form
- `types`, `abilities` - Reference tables

## Testing

### Unit Tests (Vitest)
Located in `__tests__/` directories. Run with `npm test`.

### E2E Tests (Playwright)
Located in `tests/`. Run with `npm run test:e2e`.

Coverage requirements:
- All species pages load without errors
- Search, filtering, and sorting work
- Evolution navigation works
- Assets load correctly (sprite extraction)

## Troubleshooting

### Missing Sprites
EBDX sprites are horizontal sprite sheets. The `SpriteDisplay` component uses Canvas to extract the first frame. If sprites appear blank:
1. Check the asset path in the database
2. Verify the file exists in Graphics/EBDX/Battlers/Front/
3. Check browser console for Canvas errors

### Database Issues
```bash
# Verify database integrity
node -e "const db = require('better-sqlite3')('./out/dex.db'); console.log(db.pragma('integrity_check'));"
```

### Rebuild Pipeline
```bash
# Clean and rebuild
rm -rf out/*
npm run rebuild
```
