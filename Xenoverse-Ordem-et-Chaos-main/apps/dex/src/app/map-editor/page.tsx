
'use client';

import { useState, useRef, useEffect } from 'react';

// Hardcoded list of map locations we want to track.
// Ideally fetched from DB: SELECT DISTINCT map_name FROM encounters
// We can paste the list here for now or fetch it.
// I'll add a fetch effect.

interface Coordinate {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface MapCoordinates {
    [mapName: string]: Coordinate;
}

export default function MapEditor() {
    const [maps, setMaps] = useState<string[]>([]);
    const [selectedMap, setSelectedMap] = useState<string | null>(null);
    const [coordinates, setCoordinates] = useState<MapCoordinates>({});
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentRect, setCurrentRect] = useState<Coordinate | null>(null);

    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // Fetch unique map names
        // Since we don't have an API for this, I'll just hardcode some or create a quick API.
        // For now, let's hardcode a few common ones to test.
        // Or better, create a server action/api route? 
        // Let's use a text area to paste map names for now to avoid complexity.
        setMaps(['Route 1', 'Route 2', 'String Forest', 'Gravity Tunnel', 'Route 3']);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imageRef.current || !selectedMap) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setStartPos({ x, y });
        setIsDrawing(true);
        setCurrentRect({ x, y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !imageRef.current || !selectedMap) return;
        const rect = imageRef.current.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / rect.width) * 100;
        const currentY = ((e.clientY - rect.top) / rect.height) * 100;

        const x = Math.min(startPos.x, currentX);
        const y = Math.min(startPos.y, currentY);
        const width = Math.abs(currentX - startPos.x);
        const height = Math.abs(currentY - startPos.y);

        setCurrentRect({ x, y, width, height });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !selectedMap || !currentRect) return;
        setIsDrawing(false);
        setCoordinates(prev => ({
            ...prev,
            [selectedMap]: currentRect
        }));
        setCurrentRect(null);
    };

    const copyJSON = () => {
        navigator.clipboard.writeText(JSON.stringify(coordinates, null, 2));
        alert('Copied to clipboard!');
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white p-4 gap-4">
            <div className="w-64 flex flex-col gap-4">
                <h2 className="text-xl font-bold">Map Editor</h2>
                <div className="flex-1 overflow-y-auto bg-gray-800 rounded p-2">
                    {maps.map(map => (
                        <div
                            key={map}
                            className={`p-2 cursor-pointer hover:bg-gray-700 ${selectedMap === map ? 'bg-blue-600' : ''} ${coordinates[map] ? 'text-green-400' : ''}`}
                            onClick={() => setSelectedMap(map)}
                        >
                            {map} {coordinates[map] && '✓'}
                        </div>
                    ))}
                </div>
                <button onClick={copyJSON} className="bg-green-600 p-2 rounded hover:bg-green-500">Copy JSON</button>
            </div>

            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
                <div className="relative inline-block">
                    <img
                        ref={imageRef}
                        src="/world_map.png"
                        alt="World Map"
                        className="max-h-[90vh] object-contain select-none"
                        draggable={false}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                    />

                    {/* Render saved regions */}
                    {Object.entries(coordinates).map(([name, rect]) => (
                        <div
                            key={name}
                            className="absolute border-2 border-green-500 bg-green-500/30 hover:bg-green-500/50"
                            style={{
                                left: `${rect.x}%`,
                                top: `${rect.y}%`,
                                width: `${rect.width}%`,
                                height: `${rect.height}%`,
                            }}
                            title={name}
                        />
                    ))}

                    {/* Render drawing rect */}
                    {currentRect && (
                        <div
                            className="absolute border-2 border-blue-500 bg-blue-500/30"
                            style={{
                                left: `${currentRect.x}%`,
                                top: `${currentRect.y}%`,
                                width: `${currentRect.width}%`,
                                height: `${currentRect.height}%`,
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
