'use client';

import { useState } from 'react';
import { getPokeAPISpriteUrl } from '@/lib/dexMapping';

interface SpeciesIconProps {
  iconPath: string | null;
  frontPath?: string | null;
  speciesId?: string | null;
  name: string;
  type1?: string | null;
  type2?: string | null;
  size?: number;
  className?: string;
}

/**
 * Smart species icon component with multiple fallback strategies:
 * 1. Use icon if available
 * 2. Extract first frame from front sprite if available
 * 3. Try PokeAPI CDN for standard Pokémon
 * 4. Show type-colored placeholder with first letter
 */
export default function SpeciesIcon({
  iconPath,
  frontPath,
  speciesId,
  name,
  type1,
  type2,
  size = 56,
  className = '',
}: SpeciesIconProps) {
  const [iconError, setIconError] = useState(false);
  const [frontError, setFrontError] = useState(false);
  const [pokeapiError, setPokeapiError] = useState(false);

  // Get PokeAPI CDN URL for standard Pokémon
  const lookupId = speciesId || name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const pokeapiUrl = getPokeAPISpriteUrl(lookupId);

  // Type colors for placeholder
  const getTypeColor = (type: string | null | undefined): string => {
    if (!type) return '#6B7280'; // gray-500
    const colors: Record<string, string> = {
      NORMAL: '#A8A878',
      FIRE: '#F08030',
      WATER: '#6890F0',
      ELECTRIC: '#F8D030',
      GRASS: '#78C850',
      ICE: '#98D8D8',
      FIGHTING: '#C03028',
      POISON: '#A040A0',
      GROUND: '#E0C068',
      FLYING: '#A890F0',
      PSYCHIC: '#F85888',
      BUG: '#A8B820',
      ROCK: '#B8A038',
      GHOST: '#705898',
      DRAGON: '#7038F8',
      DARK: '#705848',
      STEEL: '#B8B8D0',
      FAIRY: '#EE99AC',

      SOUND: '#C5A3CC',
    };
    return colors[type.toUpperCase()] || colors.NORMAL;
  };

  const primaryColor = getTypeColor(type1);
  const secondaryColor = getTypeColor(type2);

  // If we have an icon and it hasn't errored, show it
  if (iconPath && !iconError) {
    return (
      <div className={`${className} bg-gray-800/30 rounded-lg flex items-center justify-center`} style={{ width: size, height: size }}>
        <img
          key={iconPath} // Force re-render if path changes
          src={`/${iconPath}`}
          alt={name}
          className="w-full h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget;
            // If image is a sprite sheet (very wide), fallback to PokeAPI
            // Typical sprite sheet is multiple frames side-by-side
            if (img.naturalWidth / img.naturalHeight > 4) {
              console.warn('Image detected as sprite sheet (too wide), falling back:', iconPath);
              setIconError(true);
            }
          }}
          onError={(e) => {
            console.error('Primary icon load failed for:', iconPath);
            // This state update triggers re-render, moving to Fallback 1
            setIconError(true);
          }}
          // Ensure display isn't none
          style={{ display: 'block' }}
        />
      </div>
    );
  }

  // Fallback 1: Try PokeAPI CDN for standard Pokémon (preferred - clean static sprites)
  if (pokeapiUrl && !pokeapiError) {
    return (
      <div className={`${className} bg-gray-800/30 rounded-lg flex items-center justify-center`} style={{ width: size, height: size }}>
        <img
          src={pokeapiUrl}
          alt={name || 'Pokemon'}
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error('PokeAPI load failed:', pokeapiUrl);
            setPokeapiError(true);
          }}
          style={{
            imageRendering: 'pixelated',
          }}
        />
      </div>
    );
  }

  // Fallback 2: Try local front sprite if CDN unavailable (may be sprite sheet)
  if (frontPath && !frontError) {
    return (
      <div className={`${className} bg-gray-800/30 rounded-lg flex items-center justify-center`} style={{ width: size, height: size }}>
        <img
          src={`/${frontPath}`}
          alt={name || 'Pokemon'}
          className="w-full h-full object-contain opacity-80"
          onError={(e) => {
            console.error('Local sprite load failed:', frontPath);
            setFrontError(true);
          }}
          style={{
            imageRendering: 'pixelated',
            filter: 'brightness(1.1) contrast(1.05)',
          }}
        />
      </div>
    );
  }

  // Fallback 3: Show type-colored placeholder with initial
  const initial = (name || '?').charAt(0).toUpperCase();
  const gradient =
    type2 && type1
      ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
      : primaryColor;

  return (
    <div
      className={`flex items-center justify-center rounded-lg font-bold text-white ${className}`}
      style={{
        width: size,
        height: size,
        background: gradient,
        fontSize: size * 0.45,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
      }}
      title={`${name} (no icon)`}
    >
      {initial}
    </div>
  );
}
