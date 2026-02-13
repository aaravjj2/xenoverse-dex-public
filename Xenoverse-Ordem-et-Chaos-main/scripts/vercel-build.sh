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

# Ensure DB and map graph exist
if [ -f out/dex.db ]; then
  if [ -f apps/dex/dex.db ] && cmp -s out/dex.db apps/dex/dex.db; then
    echo "out/dex.db identical to apps/dex/dex.db — skipping copy"
  else
    cp out/dex.db apps/dex/dex.db
  fi
else
  echo "ERROR: out/dex.db missing" >&2
  exit 1
fi

if [ -f out/map_graph.json ]; then
  if [ -f apps/dex/map_graph.json ] && cmp -s out/map_graph.json apps/dex/map_graph.json; then
    echo "out/map_graph.json identical to apps/dex/map_graph.json — skipping copy"
  else
    cp out/map_graph.json apps/dex/map_graph.json
  fi
else
  echo "ERROR: out/map_graph.json missing" >&2
  exit 1
fi

# Build the Next.js app
cd apps/dex
npm run build
