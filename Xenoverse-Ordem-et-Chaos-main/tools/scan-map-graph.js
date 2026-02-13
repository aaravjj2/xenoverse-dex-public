/**
 * Scan all Map*.rxdata files for Transfer Player events (code 201)
 * and build a complete graph of map connections.
 * Output: out/map_graph.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from './export/marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'Data');
const OUT_DIR = join(REPO_ROOT, 'out');

function scanAllMaps() {
  const files = readdirSync(DATA_DIR).filter(f => f.match(/^Map\d{3}\.rxdata$/));
  const graph = {}; // { mapId: [destMapId1, destMapId2, ...] }
  let totalMaps = 0;
  let mapsWithTransfers = 0;
  let totalEdges = 0;

  console.log(`Found ${files.length} map files to scan...`);

  for (const filename of files) {
    const mapIdMatch = filename.match(/^Map(\d{3})\.rxdata$/);
    if (!mapIdMatch) continue;

    const mapId = parseInt(mapIdMatch[1], 10);
    totalMaps++;

    try {
      const filepath = join(DATA_DIR, filename);
      const buffer = readFileSync(filepath);
      const result = decode(buffer);
      const mapData = result.data;

      if (!mapData.events) continue;

      const destinations = new Set();

      // Scan all events for Transfer Player commands (code 201)
      for (const eventId in mapData.events) {
        const event = mapData.events[eventId];
        if (!event || !event.pages) continue;

        for (const page of event.pages) {
          if (!page.list) continue;

          for (const cmd of page.list) {
            if (cmd.code === 201) {
              // Transfer Player command
              // params: [0=constant/variable, mapId, x, y, direction, fadeType]
              // We want mapId (params[1])
              if (cmd.parameters && cmd.parameters.length > 1) {
                const destMapId = cmd.parameters[1];
                if (typeof destMapId === 'number' && destMapId > 0) {
                  destinations.add(destMapId);
                }
              }
            }
          }
        }
      }

      if (destinations.size > 0) {
        graph[mapId] = Array.from(destinations).sort((a, b) => a - b);
        mapsWithTransfers++;
        totalEdges += destinations.size;
      }
    } catch (e) {
      console.warn(`Warning: Failed to process ${filename}: ${e.message}`);
    }
  }

  console.log(`\nScan complete:`);
  console.log(`  Total maps: ${totalMaps}`);
  console.log(`  Maps with transfers: ${mapsWithTransfers}`);
  console.log(`  Total transfer edges: ${totalEdges}`);

  // Write output
  const outputPath = join(OUT_DIR, 'map_graph.json');
  writeFileSync(outputPath, JSON.stringify(graph, null, 2));
  console.log(`\nWrote map graph to ${outputPath}`);
}

scanAllMaps();
