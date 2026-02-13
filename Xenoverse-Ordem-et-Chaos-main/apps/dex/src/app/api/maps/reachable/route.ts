import { NextRequest, NextResponse } from 'next/server';
import { getReachableMaps } from '@/lib/mapGraph';
import { getWorldFactMaps } from '@/lib/db/world';

/**
 * GET /api/maps/reachable?milestone=<mapName>
 * Returns all map IDs reachable up to and including the milestone map.
 * If no milestone provided, returns all maps.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const milestone = searchParams.get('milestone');

    // Get all maps from world_facts
    const allMaps = getWorldFactMaps();

    if (!milestone) {
      // Return all map IDs
      return NextResponse.json({
        success: true,
        milestone: null,
        mapIds: allMaps.map(m => m.mapId),
        count: allMaps.length
      });
    }

    // Find the milestone map
    const milestoneMap = allMaps.find(m => 
      m.mapName?.toLowerCase().includes(milestone.toLowerCase())
    );

    if (!milestoneMap) {
      return NextResponse.json({
        success: false,
        error: `Milestone map not found: ${milestone}`,
        availableMaps: allMaps.slice(0, 20).map(m => ({ id: m.mapId, name: m.mapName }))
      }, { status: 404 });
    }

    // Start from map 2 (game start) and find all reachable maps up to milestone
    const START_MAP = 2; // Assuming game starts at map 2
    const reachableMaps = getReachableMaps([START_MAP, milestoneMap.mapId]);

    return NextResponse.json({
      success: true,
      milestone: milestoneMap.mapName,
      milestoneMapId: milestoneMap.mapId,
      startMapId: START_MAP,
      mapIds: Array.from(reachableMaps).sort((a, b) => a - b),
      count: reachableMaps.size
    });
  } catch (error) {
    console.error('Error in /api/maps/reachable:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
