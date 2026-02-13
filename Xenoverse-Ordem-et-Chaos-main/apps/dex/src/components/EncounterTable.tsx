
import React from 'react';
import { EncounterEntry } from '../lib/db';

interface EncounterTableProps {
    encounters: EncounterEntry[];
}

export default function EncounterTable({ encounters }: EncounterTableProps) {
    if (!encounters || encounters.length === 0) {
        return null;
    }

    // Group by map
    const byMap = encounters.reduce((acc, enc) => {
        if (!acc[enc.map_name]) {
            acc[enc.map_name] = [];
        }
        acc[enc.map_name].push(enc);
        return acc;
    }, {} as Record<string, EncounterEntry[]>);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(byMap).map(([mapName, locations]) => (
                    <div key={mapName} className="bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">
                            {mapName}
                        </h3>
                        <div className="space-y-2">
                            {locations.map((loc, idx) => (
                                <div key={`${mapName}-${idx}`} className="flex justify-between items-center text-sm">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-blue-300">{loc.type}</span>
                                        <span className="text-gray-400 text-xs">
                                            Lvl {loc.min_level === loc.max_level ? loc.min_level : `${loc.min_level}-${loc.max_level}`}
                                        </span>
                                    </div>
                                    <span className="font-bold text-gray-300 bg-gray-700 px-2 py-1 rounded">
                                        {loc.chance}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
