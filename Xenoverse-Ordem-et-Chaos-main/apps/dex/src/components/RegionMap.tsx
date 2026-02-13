'use client';

import Image from 'next/image';

interface RegionMapProps {
    mapName: string | null;
    className?: string;
}

// Inlined coordinates to avoid import issues on Vercel
interface Coordinate {
    x: number;
    y: number;
    width: number;
    height: number;
}

const MapCoordinates: Record<string, Coordinate> = {
    "Westar City": { x: 15, y: 25, width: 4, height: 4 },
    "Ishtar City": { x: 45, y: 20, width: 4, height: 4 },
    "Hadwarf City": { x: 75, y: 25, width: 4, height: 4 },
    "Newtron City": { x: 30, y: 45, width: 4, height: 4 },
    "Hypelion City": { x: 60, y: 45, width: 4, height: 4 },
    "Vega City": { x: 25, y: 65, width: 4, height: 4 },
    "Vermillion City": { x: 55, y: 70, width: 4, height: 4 },
    "Milkyway Kingdom": { x: 85, y: 15, width: 5, height: 5 },
    "Borealis Town": { x: 10, y: 10, width: 3, height: 3 },
    "Polaris Town": { x: 20, y: 15, width: 3, height: 3 },
    "Stellato Town": { x: 35, y: 30, width: 3, height: 3 },
    "Calen Village": { x: 50, y: 35, width: 3, height: 3 },
    "Equinox Village": { x: 70, y: 40, width: 3, height: 3 },
    "Fortbelt Town": { x: 40, y: 55, width: 3, height: 3 },
    "Route 2": { x: 12, y: 18, width: 2, height: 2 },
    "Route 3": { x: 18, y: 20, width: 2, height: 2 },
    "Route 4": { x: 25, y: 22, width: 2, height: 2 },
    "Route 5": { x: 32, y: 25, width: 2, height: 2 },
    "Route 6": { x: 38, y: 28, width: 2, height: 2 },
    "Route 7": { x: 45, y: 30, width: 2, height: 2 },
    "Route 8": { x: 52, y: 32, width: 2, height: 2 },
    "Route 9": { x: 58, y: 38, width: 2, height: 2 },
    "Route 10": { x: 65, y: 42, width: 2, height: 2 },
    "Route 11": { x: 48, y: 48, width: 2, height: 2 },
    "Route 12": { x: 42, y: 52, width: 2, height: 2 },
    "Route 13": { x: 35, y: 58, width: 2, height: 2 },
    "Route 14": { x: 28, y: 62, width: 2, height: 2 },
    "Route 15": { x: 45, y: 65, width: 2, height: 2 },
    "Route 16": { x: 52, y: 68, width: 2, height: 2 },
    "Route 17": { x: 62, y: 72, width: 2, height: 2 },
    "Aquarius Pool": { x: 8, y: 75, width: 3, height: 3 },
    "Pisces Oasis": { x: 18, y: 80, width: 3, height: 3 },
    "Aries Arena": { x: 28, y: 78, width: 3, height: 3 },
    "Taurus Cellar": { x: 38, y: 76, width: 3, height: 3 },
    "Gemini Grotto": { x: 48, y: 80, width: 3, height: 3 },
    "Cancer Crater": { x: 58, y: 78, width: 3, height: 3 },
    "Leo Littoral": { x: 68, y: 76, width: 3, height: 3 },
    "Virgo Grove": { x: 78, y: 80, width: 3, height: 3 },
    "Libra Ruin": { x: 88, y: 78, width: 3, height: 3 },
    "Scorpio Garden": { x: 85, y: 65, width: 3, height: 3 },
    "Sagittarius Holt": { x: 82, y: 52, width: 3, height: 3 },
    "Capricorn Crest": { x: 78, y: 38, width: 3, height: 3 },
    "Ophiuchus Hole": { x: 90, y: 45, width: 3, height: 3 },
    "Mt. Zodiac": { x: 88, y: 30, width: 4, height: 4 },
    "Alter Mt. Zodiac": { x: 92, y: 25, width: 3, height: 3 },
    "String Forest": { x: 22, y: 32, width: 4, height: 4 },
    "Pitch Black Forest": { x: 12, y: 60, width: 4, height: 4 },
    "Cluster Jungle": { x: 72, y: 55, width: 4, height: 4 },
    "Nebula Swamp": { x: 5, y: 45, width: 4, height: 4 },
    "Nova Ranch": { x: 55, y: 25, width: 3, height: 3 },
    "Gravity Tunnel": { x: 65, y: 28, width: 3, height: 3 },
    "Gravity Tunnel Depths": { x: 68, y: 32, width: 2, height: 2 },
    "Historia Cave": { x: 35, y: 42, width: 3, height: 3 },
    "Victory Road": { x: 80, y: 8, width: 4, height: 4 },
    "Zero Cave": { x: 78, y: 68, width: 3, height: 3 },
    "Darkhole Island": { x: 5, y: 85, width: 5, height: 5 },
    "Darkhole Island Shore": { x: 10, y: 88, width: 3, height: 3 },
    "Comet Wreck": { x: 92, y: 8, width: 4, height: 4 },
    "Shinobi Island": { x: 5, y: 35, width: 4, height: 4 },
    "Proxim Island": { x: 92, y: 55, width: 3, height: 3 },
    "S.S. Comet": { x: 48, y: 12, width: 3, height: 3 },
    "Shyleon Temple": { x: 42, y: 8, width: 4, height: 4 },
    "Trishout Temple": { x: 62, y: 12, width: 3, height: 3 },
    "Magellan Shrine": { x: 72, y: 18, width: 3, height: 3 },
    "Cardinal's Palace": { x: 50, y: 5, width: 4, height: 3 },
    "Cardinal's Pagoda": { x: 54, y: 8, width: 2, height: 2 },
    "Cardinal's Sanctuary": { x: 46, y: 8, width: 2, height: 2 },
    "Stardust Beach": { x: 15, y: 50, width: 4, height: 3 },
    "Sakura Paradise": { x: 65, y: 58, width: 4, height: 4 },
    "Welkin Falls": { x: 28, y: 38, width: 3, height: 3 },
    "Sunflare Canyon": { x: 82, y: 42, width: 3, height: 3 },
    "Meteoroid Gorge": { x: 58, y: 52, width: 3, height: 3 },
    "Mt. Starburst": { x: 75, y: 12, width: 4, height: 4 },
    "Sunshine Circus": { x: 38, y: 62, width: 3, height: 3 },
    "Wild Bull Saloon": { x: 18, y: 28, width: 2, height: 2 },
    "Eldiw Casino": { x: 52, y: 42, width: 3, height: 3 },
    "El Pugatorio": { x: 68, y: 62, width: 3, height: 3 },
    "Dimension Base": { x: 8, y: 92, width: 4, height: 4 },
    "Abandoned Bunker": { x: 15, y: 90, width: 3, height: 3 },
    "Xenoverse": { x: 50, y: 90, width: 5, height: 5 },
    "Area Grey": { x: 88, y: 90, width: 4, height: 4 },
    "Heroes' Path": { x: 75, y: 5, width: 4, height: 3 },
    "Apollo Tournament": { x: 90, y: 12, width: 3, height: 3 },
    "Battle Condo": { x: 60, y: 8, width: 3, height: 2 },
    "Westar Gym": { x: 17, y: 27, width: 2, height: 2 },
    "Ishtar Gym": { x: 47, y: 22, width: 2, height: 2 },
    "Hadwarf Gym": { x: 77, y: 27, width: 2, height: 2 },
    "Newtron Gym": { x: 32, y: 47, width: 2, height: 2 },
    "Hypelion Gym": { x: 62, y: 47, width: 2, height: 2 },
    "Vermillion Gym": { x: 57, y: 72, width: 2, height: 2 },
    "Milkyway Gym": { x: 87, y: 17, width: 2, height: 2 },
    "Westar Cemetary": { x: 13, y: 28, width: 2, height: 2 },
    "Samuel Oak Airport": { x: 42, y: 15, width: 3, height: 2 },
    "Gravity Pathway": { x: 62, y: 30, width: 2, height: 2 },
    "Vega Department Store": { x: 27, y: 67, width: 2, height: 2 },
    "Vega Sewers": { x: 23, y: 68, width: 2, height: 2 },
    "Westar Railway Station": { x: 18, y: 23, width: 2, height: 2 },
};

export default function RegionMap({ mapName, className = '' }: RegionMapProps) {
    let coords = mapName ? MapCoordinates[mapName] : null;

    // Fuzzy match if strict match fails
    if (mapName && !coords) {
        const normalizedName = mapName.trim().toLowerCase();
        const match = Object.keys(MapCoordinates).find(key =>
            key.toLowerCase() === normalizedName ||
            key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName.replace(/[^a-z0-9]/g, '')
        );
        if (match) {
            coords = MapCoordinates[match];
        }
    }

    if (!coords) {
        return (
            <div className={`bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center text-center ${className}`}>
                <div className="w-full aspect-video bg-gray-900 rounded mb-2 flex items-center justify-center relative overflow-hidden">
                    <Image
                        src="/world_map_pixel.png"
                        alt="World Map"
                        fill
                        className={`object-contain ${mapName ? 'opacity-50' : 'opacity-100'}`}
                        unoptimized
                    />
                    {mapName && (
                        <span className="relative z-10 text-xs text-yellow-500 font-bold bg-black/50 px-2 py-1 rounded">
                            Location Unknown
                        </span>
                    )}
                </div>
                {mapName && <span className="text-sm text-gray-400">{mapName}</span>}
            </div>
        );
    }

    return (
        <div className={`bg-gray-800 rounded-lg p-2 ${className}`}>
            <div className="relative w-full aspect-video bg-black rounded overflow-hidden">
                <Image
                    src="/world_map_pixel.png"
                    alt="World Map"
                    fill
                    className="object-contain"
                    unoptimized
                />

                {/* Blinking Overlay */}
                <div
                    className="absolute border-2 border-red-500 bg-red-500/50 animate-pulse box-content z-10"
                    style={{
                        left: `${coords.x}%`,
                        top: `${coords.y}%`,
                        width: `${coords.width}%`,
                        height: `${coords.height}%`,
                        boxShadow: '0 0 10px rgba(255, 0, 0, 0.8)'
                    }}
                />
            </div>
            <div className="mt-2 text-center text-sm font-medium text-gray-300">
                {mapName}
            </div>
        </div>
    );
}
