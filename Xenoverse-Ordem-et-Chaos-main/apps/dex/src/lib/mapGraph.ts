/**
 * Map graph utilities for reachability analysis.
 * Uses the pre-generated map graph from tools/scan-map-graph.js
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Type for the map graph: mapId -> array of destination mapIds
type MapGraph = Record<string, number[]>;

let cachedMapGraph: MapGraph | null = null;

/**
 * Load the map graph from the JSON file (cached after first load)
 */
function loadMapGraph(): MapGraph {
  if (cachedMapGraph) {
    return cachedMapGraph;
  }

  try {
    // Production: map_graph.json is copied to apps/dex/ by vercel.json buildCommand
    // Development: load from ../../out/map_graph.json
    const graphPath = process.env.NODE_ENV === 'production' 
      ? join(process.cwd(), 'map_graph.json')
      : join(process.cwd(), '../../out/map_graph.json');
    
    const data = readFileSync(graphPath, 'utf-8');
    cachedMapGraph = JSON.parse(data) as MapGraph;
    return cachedMapGraph;
  } catch (err) {
    console.warn('Could not load map_graph.json, using empty graph:', err);
    cachedMapGraph = {};
    return cachedMapGraph;
  }
}

/**
 * Performs BFS to find all maps reachable from a set of starting maps.
 * @param startMapIds - Array of starting map IDs
 * @returns Set of all reachable map IDs (including starting maps)
 */
export function getReachableMaps(startMapIds: number[]): Set<number> {
  const mapGraph = loadMapGraph();
  const reachable = new Set<number>();
  const queue: number[] = [...startMapIds];
  
  // Mark starting maps as reachable
  for (const mapId of startMapIds) {
    reachable.add(mapId);
  }
  
  // BFS traversal
  while (queue.length > 0) {
    const currentMapId = queue.shift()!;
    const neighbors = mapGraph[currentMapId.toString()] || [];
    
    for (const neighborId of neighbors) {
      if (!reachable.has(neighborId)) {
        reachable.add(neighborId);
        queue.push(neighborId);
      }
    }
  }
  
  return reachable;
}

/**
 * Gets all maps from the graph.
 * @returns Array of all map IDs in the graph
 */
export function getAllMapIds(): number[] {
  const mapGraph = loadMapGraph();
  return Object.keys(mapGraph).map(id => parseInt(id, 10));
}

/**
 * Gets direct neighbors (destinations) for a given map.
 * @param mapId - The map ID to get neighbors for
 * @returns Array of destination map IDs
 */
export function getMapNeighbors(mapId: number): number[] {
  const mapGraph = loadMapGraph();
  return mapGraph[mapId.toString()] || [];
}
