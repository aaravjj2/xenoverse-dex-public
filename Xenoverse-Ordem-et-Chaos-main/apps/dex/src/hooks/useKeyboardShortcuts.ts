'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  action: () => void;
  description: string;
  enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape to blur the element
        if (e.key === 'Escape') {
          (target as HTMLInputElement).blur();
        }
        return;
      }

      shortcuts.forEach(({ key, modifiers = {}, action, enabled = true }) => {
        if (!enabled) return;

        const ctrlMatch = modifiers.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = modifiers.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = modifiers.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          action();
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Pre-built navigation shortcuts
export function useNavigationShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: () => router.push('/'),
      description: 'Go to Pokédex',
      enabled: pathname !== '/',
    },
    {
      key: 't',
      action: () => router.push('/types'),
      description: 'Go to Types',
      enabled: pathname !== '/types',
    },
    {
      key: 'a',
      action: () => router.push('/abilities'),
      description: 'Go to Abilities',
      enabled: pathname !== '/abilities',
    },
    {
      key: 'm',
      action: () => router.push('/moves'),
      description: 'Go to Moves',
      enabled: pathname !== '/moves',
    },
    {
      key: 'i',
      action: () => router.push('/items'),
      description: 'Go to Items',
      enabled: pathname !== '/items',
    },
    {
      key: 'r',
      action: () => router.push('/trainers'),
      description: 'Go to Trainers',
      enabled: pathname !== '/trainers',
    },
    {
      key: 'w',
      action: () => router.push('/world'),
      description: 'Go to World',
      enabled: pathname !== '/world',
    },
    {
      key: 'c',
      action: () => router.push('/compare'),
      description: 'Go to Compare',
      enabled: pathname !== '/compare',
    },
    {
      key: 'p',
      action: () => router.push('/team'),
      description: 'Go to Team Builder',
      enabled: pathname !== '/team',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Search focus shortcut
export function useSearchShortcut(searchInputRef: React.RefObject<HTMLInputElement | null>) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '/',
      action: () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      },
      description: 'Focus search',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}

// Random navigation shortcut
export function useRandomShortcut(onRandom: () => void) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'r',
      modifiers: { shift: true },
      action: onRandom,
      description: 'Random Pokémon',
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
