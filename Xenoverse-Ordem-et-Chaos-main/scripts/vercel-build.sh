#!/usr/bin/env bash
set -euo pipefail

# Ensure script runs from repository project root (so it works when invoked from a different cwd)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Prepare public assets
mkdir -p apps/dex/public
if [ -d Graphics ]; then
  rm -rf apps/dex/public/Graphics
  cp -r Graphics apps/dex/public/
else
  echo "root Graphics not present, using bundled apps/dex/public/Graphics"
fi

# Ensure DB and map graph exist (be tolerant if artifacts are missing)
# If `out/` is missing, try using bundled artifacts or generate them via `npm run export`.
GENERATED_OUT=false

if [ -f out/dex.db ]; then
  if [ -f apps/dex/dex.db ] && cmp -s out/dex.db apps/dex/dex.db; then
    echo "out/dex.db identical to apps/dex/dex.db — skipping copy"
  else
    cp out/dex.db apps/dex/dex.db
  fi
else
  if [ -f apps/dex/dex.db ]; then
    echo "out/dex.db missing — using bundled apps/dex/dex.db"
  else
    echo "out/dex.db missing — attempting to generate 'out/' with 'npm run export'"
    npm run export
    GENERATED_OUT=true

    # After export the JSON files exist but the SQLite DB is created by the ingest step.
    if [ -f out/dex.db ]; then
      cp out/dex.db apps/dex/dex.db
    else
      echo "out/dex.db not present after export — running ingest + relationships to build dex.db"
      npm run ingest && npm run relationships || true

      if [ -f out/dex.db ]; then
        cp out/dex.db apps/dex/dex.db
      else
        echo "ERROR: out/dex.db still missing after ingest/relationships" >&2
        echo "Listing 'out/' contents for debugging:" >&2
        ls -la out || true
        exit 1
      fi
    fi
  fi
fi

if [ -f out/map_graph.json ]; then
  if [ -f apps/dex/map_graph.json ] && cmp -s out/map_graph.json apps/dex/map_graph.json; then
    echo "out/map_graph.json identical to apps/dex/map_graph.json — skipping copy"
  else
    cp out/map_graph.json apps/dex/map_graph.json
  fi
else
  if [ -f apps/dex/map_graph.json ]; then
    echo "out/map_graph.json missing — using bundled apps/dex/map_graph.json"
  else
    if [ "$GENERATED_OUT" = false ]; then
      echo "out/map_graph.json missing — attempting to generate 'out/' with 'npm run export'"
      npm run export
      GENERATED_OUT=true
    else
      echo "Previously ran export; checking for generated files..."
    fi

    if [ -f out/map_graph.json ]; then
      cp out/map_graph.json apps/dex/map_graph.json
    else
      echo "ERROR: out/map_graph.json still missing after generation attempt" >&2
      exit 1
    fi
  fi
fi

# Build the Next.js app
cd apps/dex
npm run build
