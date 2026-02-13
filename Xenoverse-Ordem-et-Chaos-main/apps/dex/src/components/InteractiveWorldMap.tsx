'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface InteractiveWorldMapProps {
    className?: string;
    onLocationClick?: (mapName: string) => void;
}

// Pin coordinates for clickable location markers on the world map
const MapCoordinates: Record<string, { top: string; left: string }> = {
    // Major Cities & Towns
    "Westar City": { top: "27%", left: "17%" },
    "Ishtar City": { top: "22%", left: "47%" },
    "Hadwarf City": { top: "27%", left: "77%" },
    "Newtron City": { top: "47%", left: "32%" },
    "Hypelion City": { top: "47%", left: "62%" },
    "Vega City": { top: "67%", left: "27%" },
    "Vermillion City": { top: "72%", left: "57%" },
    "Milkyway Kingdom": { top: "18%", left: "88%" },
    "Borealis Town": { top: "12%", left: "12%" },
    "Polaris Town": { top: "17%", left: "22%" },
    "Stellato Town": { top: "32%", left: "37%" },
    "Calen Village": { top: "37%", left: "52%" },
    "Equinox Village": { top: "42%", left: "72%" },
    "Fortbelt Town": { top: "57%", left: "42%" },
    
    // Gyms (at city locations)
    "Westar Gym": { top: "27%", left: "17%" },
    "Ishtar Gym": { top: "22%", left: "47%" },
    "Hadwarf Gym": { top: "27%", left: "77%" },
    "Newtron Gym": { top: "47%", left: "32%" },
    "Hypelion Gym": { top: "47%", left: "62%" },
    "Vermillion Gym": { top: "72%", left: "57%" },
    "Milkyway Gym": { top: "18%", left: "88%" },
    
    // Buildings & Shops
    "Vega Department Store": { top: "67%", left: "27%" },
    "Wild Bull Saloon": { top: "17%", left: "22%" },
    
    // Routes
    "Route 2": { top: "13%", left: "15%" },
    "Route 3": { top: "19%", left: "25%" },
    "Route 4": { top: "24%", left: "32%" },
    "Route 5": { top: "25%", left: "42%" },
    "Route 6": { top: "24%", left: "52%" },
    "Route 7": { top: "25%", left: "62%" },
    "Route 8": { top: "24%", left: "72%" },
    "Route 9": { top: "20%", left: "83%" },
    "Route 10": { top: "37%", left: "42%" },
    "Route 11": { top: "42%", left: "47%" },
    "Route 12": { top: "52%", left: "47%" },
    "Route 13": { top: "57%", left: "52%" },
    "Route 14": { top: "62%", left: "42%" },
    "Route 15": { top: "70%", left: "42%" },
    "Route 16": { top: "70%", left: "52%" },
    "Route 17": { top: "65%", left: "67%" },
    
    // Landmarks & Special Locations
    "String Forest": { top: "34%", left: "24%" },
    "Pitch Black Forest": { top: "62%", left: "14%" },
    "Cluster Jungle": { top: "57%", left: "74%" },
    "Nebula Swamp": { top: "47%", left: "7%" },
    "Nova Ranch": { top: "27%", left: "57%" },
    "Gravity Tunnel": { top: "30%", left: "67%" },
    "Historia Cave": { top: "44%", left: "37%" },
    "Victory Road": { top: "10%", left: "82%" },
    "Zero Cave": { top: "70%", left: "80%" },
    "Darkhole Island": { top: "87%", left: "8%" },
    "Comet Wreck": { top: "10%", left: "94%" },
    "Shinobi Island": { top: "37%", left: "7%" },
    "Proxim Island": { top: "57%", left: "94%" },
    "S.S. Comet": { top: "14%", left: "50%" },
    "Shyleon Temple": { top: "10%", left: "44%" },
    "Trishout Temple": { top: "14%", left: "64%" },
    "Magellan Shrine": { top: "20%", left: "74%" },
    "Mt. Zodiac": { top: "32%", left: "90%" },
    "Mt. Starburst": { top: "14%", left: "77%" },
    "Stardust Beach": { top: "52%", left: "17%" },
    "Sakura Paradise": { top: "60%", left: "67%" },
    "Welkin Falls": { top: "40%", left: "30%" },
    "Cardinal's Palace": { top: "8%", left: "50%" },
    "Xenoverse": { top: "93%", left: "53%" },
    "Area Grey": { top: "93%", left: "90%" },
};

// Category definitions
const LocationsByCategory = {
    "Buildings": [
        "Westar Gym", "Ishtar Gym", "Hadwarf Gym", "Newtron Gym", 
        "Hypelion Gym", "Vermillion Gym", "Milkyway Gym",
        "Vega Department Store", "Wild Bull Saloon"
    ],
    "Towns": [
        "Westar City", "Ishtar City", "Hadwarf City", "Newtron City",
        "Hypelion City", "Vega City", "Vermillion City", "Milkyway Kingdom",
        "Borealis Town", "Polaris Town", "Stellato Town", "Calen Village",
        "Equinox Village", "Fortbelt Town"
    ],
    "Landmarks": [
        "Shyleon Temple", "Trishout Temple", "Magellan Shrine",
        "Mt. Zodiac", "Mt. Starburst", "String Forest", "Pitch Black Forest",
        "Cluster Jungle", "Nebula Swamp", "Nova Ranch", "Gravity Tunnel",
        "Historia Cave", "Victory Road", "Zero Cave", "Darkhole Island",
        "Comet Wreck", "Shinobi Island", "Proxim Island", "S.S. Comet",
        "Stardust Beach", "Sakura Paradise"
    ],
    "Routes": [
        "Route 2", "Route 3", "Route 4", "Route 5", "Route 6", "Route 7",
        "Route 8", "Route 9", "Route 10", "Route 11", "Route 12", "Route 13",
        "Route 14", "Route 15", "Route 16", "Route 17", "Welkin Falls",
        "Xenoverse", "Area Grey", "Cardinal's Palace"
    ]
};

type CategoryKey = keyof typeof LocationsByCategory;

export default function InteractiveWorldMap({ className = '', onLocationClick }: InteractiveWorldMapProps) {
    const [zoom, setZoom] = useState(100);
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
    const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

    const allLocations = useMemo(() => {
        return Object.values(LocationsByCategory).flat();
    }, []);

    const visibleLocations = useMemo(() => {
        if (!selectedCategory) return Object.keys(MapCoordinates);
        return LocationsByCategory[selectedCategory].filter(loc => MapCoordinates[loc]);
    }, [selectedCategory]);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
    const handleResetZoom = () => setZoom(100);

    return (
        <div className={`bg-gray-900 rounded-xl overflow-hidden ${className}`}>
            {/* Map Header */}
            <div className="bg-gray-800/50 border-b border-gray-700 p-3">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">🗺️</span>
                        <h2 className="text-lg font-bold text-white">Eldiw Region</h2>
                        <span className="text-xs text-gray-400">{visibleLocations.length}/{Object.keys(MapCoordinates).length}</span>
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setZoom(100)}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                            title="Toggle labels"
                        >
                            Aa
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                            title="Zoom in"
                        >
                            +
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                            title="Zoom out"
                        >
                            −
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                            title="Reset zoom"
                        >
                            ⟲
                        </button>
                        <span className="ml-1 text-xs text-gray-400">{zoom}%</span>
                    </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400">Filter:</span>
                    {(Object.keys(LocationsByCategory) as CategoryKey[]).map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150 shadow-sm ${
                                selectedCategory === category
                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                    : 'bg-gray-700/50 text-gray-300 border-gray-600 hover:bg-gray-600/50'
                            }`}
                        >
                            <span>{category}</span>
                            <span className="opacity-70">({LocationsByCategory[category].length})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Map Image with Pin Markers */}
            <div 
                className="relative w-full aspect-video bg-black group overflow-hidden"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
            >
                <Image
                    src="/world_map_pixel.png"
                    alt="Eldiw Region"
                    fill
                    className="object-contain"
                    priority
                    unoptimized
                />
                
                {/* Static Pin Overlays */}
                <div className="absolute inset-0">
                    {Object.entries(MapCoordinates)
                        .filter(([name]) => visibleLocations.includes(name))
                        .map(([locationName, coords]) => (
                        <div
                            key={locationName}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group/pin"
                            style={{ top: coords.top, left: coords.left }}
                            onMouseEnter={() => setHoveredLocation(locationName)}
                            onMouseLeave={() => setHoveredLocation(null)}
                        >
                            <div className="relative flex flex-col items-center">
                                {/* Pin Marker Circle */}
                                <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg transition-transform hover:scale-125 ${
                                    hoveredLocation === locationName
                                        ? 'bg-amber-500 scale-125'
                                        : 'bg-emerald-500'
                                }`} />
                                
                                {/* Hover Tooltip Label */}
                                <div className="absolute top-5 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/pin:opacity-100 transition-opacity z-10 pointer-events-none">
                                    {locationName}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
