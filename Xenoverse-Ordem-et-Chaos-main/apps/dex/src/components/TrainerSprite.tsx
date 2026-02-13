'use client';

import { useState, useEffect } from 'react';

// Helper to convert trainer type to possible sprite file names
function getPossibleSpritePaths(trainerType: string): string[] {
    const paths: string[] = [];

    // 1. Title case first (most portrait files use this) - e.g., Merchant.png
    const titleCase = trainerType.split('_').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join('');
    paths.push(`/trainers/${titleCase}.png`);

    // 2. Lowercase with underscore (e.g., backpacker_m.png) - very common in Portraits
    paths.push(`/trainers/${trainerType.toLowerCase()}.png`);

    // 3. Exact match (e.g., MERCHANT.png) - for old-style files
    if (titleCase !== trainerType) {
        paths.push(`/trainers/${trainerType}.png`);
    }

    // 4. Mixed patterns for underscore types
    if (trainerType.includes('_')) {
        // BackpackerM.png pattern (joined)
        const parts = trainerType.split('_');
        const mixed = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join('');
        if (!paths.includes(`/trainers/${mixed}.png`)) {
            paths.push(`/trainers/${mixed}.png`);
        }

        // Backpacker.png (first part only)
        const firstOnly = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        if (!paths.includes(`/trainers/${firstOnly}.png`)) {
            paths.push(`/trainers/${firstOnly}.png`);
        }
    }

    // 5. Known fallback mappings for types that need specific alternates
    const SPRITE_FALLBACK_MAP: Record<string, string[]> = {
        'ALICE': ['Alice_Default', 'AliceDefault', 'POKEMONTRAINER_Leaf'],
        'KAY': ['Kay_Default', 'KayDefault', 'POKEMONTRAINER_Red'],
        'ALTER_ALICE': ['AlterAlice', 'POKEMONTRAINER_Leaf'],
        'ALTER_KAY': ['AlterKay', 'POKEMONTRAINER_Red'],
        'CLOVER': ['Clover_Default', 'CloverMain', 'COOLTRAINER_M'],
        'TEAMDIMENSION': ['Grunt', 'TEAMROCKET_M'],
        'TEAMDIMENSIONELITE': ['Grunt', 'TEAMROCKET_M'],
        'LEADER_Basil': ['Basil_Default', 'LEADER_Brock'],
        'LEADER_Vanilla': ['Vanilladefault', 'LEADER_Misty'],
        'HIPPIE_M': ['Hippie', 'ROCKER'],
        'HIPPIE_F': ['Hippie', 'BEAUTY'],
        'SCHOOLBOY': ['BookStudent', 'YOUNGSTER'],
        'SCHOOLGIRL': ['BookStudent', 'LASS'],
    };

    const fallbacks = SPRITE_FALLBACK_MAP[trainerType];
    if (fallbacks) {
        for (const fb of fallbacks) {
            const fbPath = `/trainers/${fb}.png`;
            if (!paths.includes(fbPath)) {
                paths.push(fbPath);
            }
        }
    }

    return paths;
}

interface Props {
    trainerType: string;
}

export function TrainerSprite({ trainerType }: Props) {
    const sprites = getPossibleSpritePaths(trainerType);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [failed, setFailed] = useState(false);

    // Reset on trainerType change
    useEffect(() => {
        setCurrentIndex(0);
        setFailed(false);
    }, [trainerType]);

    const handleError = () => {
        if (currentIndex < sprites.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setFailed(true);
        }
    };

    const currentSprite = sprites[currentIndex];

    if (failed) {
        return (
            <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl overflow-hidden border border-gray-600/40 shadow-lg shadow-black/20">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-900/20 to-gray-900/40">
                    <span className="text-2xl opacity-70">🎓</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-xl overflow-hidden border border-gray-600/40 shadow-lg shadow-black/20">
            <img
                key={`${trainerType}-${currentIndex}`}
                src={currentSprite}
                alt={trainerType}
                className="absolute inset-0 w-full h-full object-contain p-1"
                onError={handleError}
            />
        </div>
    );
}
