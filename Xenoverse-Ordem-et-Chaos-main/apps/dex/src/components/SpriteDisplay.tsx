'use client';

import { useState, useEffect, useRef } from 'react';

interface SpriteDisplayProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Component to display EBDX animated sprite sheets.
 * EBDX sprites are horizontal strips where the height equals the frame size.
 * This component uses Canvas to extract and display only the first frame.
 */
export default function SpriteDisplay({ 
  src, 
  alt, 
  size = 192, 
  className = '',
  onClick 
}: SpriteDisplayProps) {
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setFrameDataUrl(null);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // EBDX sprites are horizontal strips where height = frame size
        const frameSize = img.naturalHeight;
        
        // Create a canvas to extract the first frame
        const canvas = document.createElement('canvas');
        canvas.width = frameSize;
        canvas.height = frameSize;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError(true);
          return;
        }
        
        // Draw only the first frame (from 0,0 to frameSize,frameSize)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, frameSize, frameSize, 0, 0, frameSize, frameSize);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png');
        setFrameDataUrl(dataUrl);
        setLoaded(true);
      } catch (e) {
        console.error('Error extracting sprite frame:', e);
        setError(true);
      }
    };
    
    img.onerror = () => {
      setError(true);
    };
    
    img.src = src;
  }, [src]);

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-800 ${className}`}
        style={{ width: size, height: size }}
        onClick={onClick}
      >
        <span className="text-gray-600 text-4xl">?</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden flex items-center justify-center bg-gray-800 ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {loaded && frameDataUrl ? (
        <img
          src={frameDataUrl}
          alt={alt}
          style={{
            width: '85%',
            height: '85%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      ) : (
        <div className="animate-pulse bg-gray-700 w-full h-full rounded" />
      )}
    </div>
  );
}
