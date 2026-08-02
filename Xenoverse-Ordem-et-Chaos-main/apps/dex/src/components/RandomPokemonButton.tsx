'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function RandomPokemonButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleRandom = useCallback(async () => {
    if (loading || animating) return;
    
    setAnimating(true);
    setLoading(true);
    
    try {
      const res = await fetch('/api/random');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      // Brief animation delay for visual feedback
      setTimeout(() => {
        router.push(`/species/${data.id}`);
        setAnimating(false);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error('Random Pokemon error:', error);
      setAnimating(false);
      setLoading(false);
    }
  }, [loading, animating, router]);

  return (
    <button
      onClick={handleRandom}
      disabled={loading}
      className={`
        relative group flex items-center gap-2 px-4 py-2 
        bg-gradient-to-r from-purple-500/20 to-pink-500/20
        hover:from-purple-500/30 hover:to-pink-500/30
        border border-purple-500/30 hover:border-purple-500/50
        rounded-xl text-sm font-medium text-purple-300
        transition-all duration-300
        ${animating ? 'scale-95' : 'hover:scale-105'}
      `}
      title="Random Pokémon (Shift+R)"
    >
      <svg 
        className={`w-4 h-4 ${animating ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
      <span className="hidden sm:inline">Random</span>
      
      {/* Pulse animation on click */}
      {animating && (
        <span className="absolute inset-0 rounded-xl bg-purple-500/20 animate-ping" />
      )}
    </button>
  );
}
