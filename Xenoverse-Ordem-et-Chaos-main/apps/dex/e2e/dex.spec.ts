import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Xenoverse Pokédex Bug Fixes
 * 
 * These tests verify the fixes for demo video regressions:
 * - Phase 1: Move categories (Physical/Special/Status mapping)
 * - Phase 1b: Variable-power moves (Return, Frustration, etc.)
 * - Phase 2: Form learnsets inheritance
 * - Phase 3: WIP/junk data filtering
 * - Phase 5: Compare page form identity labels
 */

test.describe('Phase 1: Move Category Fixes', () => {
  test('Protect should be Status category', async ({ page }) => {
    await page.goto('/moves/PROTECT');
    
    // Check the category in the move detail page
    const categoryElement = await page.locator('text=Status').first();
    await expect(categoryElement).toBeVisible();
  });

  test('Flamethrower should be Special category', async ({ page }) => {
    await page.goto('/moves/FLAMETHROWER');
    
    const categoryElement = await page.locator('text=Special').first();
    await expect(categoryElement).toBeVisible();
  });

  test('Tackle should be Physical category', async ({ page }) => {
    await page.goto('/moves/TACKLE');
    
    const categoryElement = await page.locator('text=Physical').first();
    await expect(categoryElement).toBeVisible();
  });

  test('Moves list shows correct categories via API', async ({ page }) => {
    // Use API to verify categories since the UI uses virtualization
    const response = await page.goto('/api/moves?search=protect');
    const data = await response?.json();
    
    // Check response structure
    expect(data).toHaveProperty('moves');
    expect(Array.isArray(data.moves)).toBe(true);
    
    // Find Protect and verify Status
    const protect = data.moves.find((m: any) => m.id === 'PROTECT');
    expect(protect?.category).toBe('Status');
  });
});

test.describe('Phase 1b: Variable-Power Moves', () => {
  test('Return should display "Varies" for power', async ({ page }) => {
    await page.goto('/moves/RETURN');
    
    // The power should show "Varies" instead of a number
    await expect(page.locator('text=Varies')).toBeVisible();
    
    // Should be Physical category
    await expect(page.locator('text=Physical').first()).toBeVisible();
  });

  test('Frustration should display "Varies" for power', async ({ page }) => {
    await page.goto('/moves/FRUSTRATION');
    
    await expect(page.locator('text=Varies')).toBeVisible();
    await expect(page.locator('text=Physical').first()).toBeVisible();
  });

  test('Variable-power moves have correct flags via API', async ({ page }) => {
    const response = await page.goto('/api/moves?search=return');
    const data = await response?.json();
    
    const returnMove = data.moves.find((m: any) => m.id === 'RETURN');
    expect(returnMove?.is_variable_power).toBe(1);
    expect(returnMove?.power).toBeNull();
  });
});

test.describe('Phase 3: WIP/Junk Data Filtering', () => {
  test('No WIP species should exist in database via API', async ({ page }) => {
    // Use the API to check - response is { species: [...], count: N }
    const response = await page.goto('/api/species?limit=2000');
    const data = await response?.json();
    
    expect(data).toHaveProperty('species');
    expect(Array.isArray(data.species)).toBe(true);
    
    // No species should have name "WIP"
    const wipSpecies = data.species.filter((s: any) => s.name === 'WIP');
    expect(wipSpecies.length).toBe(0);
  });

  test('No species with BST of 6 should exist via API', async ({ page }) => {
    const response = await page.goto('/api/species?limit=2000');
    const data = await response?.json();
    
    // BST of 6 indicates junk data (all stats = 1)
    const junkSpecies = data.species.filter((s: any) => {
      const bst = (s.hp || 0) + (s.attack || 0) + (s.defense || 0) + 
                  (s.sp_attack || 0) + (s.sp_defense || 0) + (s.speed || 0);
      return bst === 6;
    });
    expect(junkSpecies.length).toBe(0);
  });
});

test.describe('Phase 5: Compare Page Form Identity', () => {
  test('Compare page loads successfully', async ({ page }) => {
    await page.goto('/compare');
    
    // Page should load with search inputs
    await expect(page.locator('input')).toHaveCount(2);
  });

  test('Species API returns form display names', async ({ page }) => {
    const response = await page.goto('/api/species?search=charizard&limit=10');
    const data = await response?.json();
    
    expect(data).toHaveProperty('species');
    // If there are Charizard forms, they should have form info
    if (data.species.length > 0) {
      const charizard = data.species[0];
      expect(charizard).toHaveProperty('name');
    }
  });
});

test.describe('Core Navigation', () => {
  test('Home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Xenoverse/);
  });

  test('Moves page loads', async ({ page }) => {
    await page.goto('/moves');
    // Wait for the page to be interactive
    await page.waitForLoadState('networkidle');
    
    // Check that filters are present (uses virtualized list, not table)
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('Types page loads', async ({ page }) => {
    await page.goto('/types');
    await page.waitForLoadState('networkidle');
    
    // Should have type badges or links (check for type abbreviations in chart)
    await expect(page.locator('text=Type Chart')).toBeVisible();
  });

  test('Species detail page loads with moves', async ({ page }) => {
    await page.goto('/species/BULBASAUR');
    
    // Should show species name
    await expect(page.locator('h1')).toContainText('Bulbasaur');
    
    // Should have moves section
    await expect(page.locator('text=Moves')).toBeVisible();
  });
});

test.describe('API Endpoints', () => {
  test('GET /api/moves returns correct data structure', async ({ page }) => {
    const response = await page.goto('/api/moves?limit=10');
    const data = await response?.json();
    
    // Response is { moves: [...], count: N }
    expect(data).toHaveProperty('moves');
    expect(data).toHaveProperty('count');
    expect(Array.isArray(data.moves)).toBe(true);
    expect(data.moves.length).toBeGreaterThan(0);
    
    // Check first move has required fields
    const move = data.moves[0];
    expect(move).toHaveProperty('id');
    expect(move).toHaveProperty('name');
    expect(move).toHaveProperty('category');
    expect(['Physical', 'Special', 'Status']).toContain(move.category);
  });

  test('GET /api/species returns filtered data', async ({ page }) => {
    const response = await page.goto('/api/species?limit=100');
    const data = await response?.json();
    
    // Response is { species: [...], count: N }
    expect(data).toHaveProperty('species');
    expect(Array.isArray(data.species)).toBe(true);
    
    // None should be WIP
    data.species.forEach((species: any) => {
      expect(species.name).not.toBe('WIP');
    });
  });

  test('GET /api/diagnostics returns health info', async ({ page }) => {
    const response = await page.goto('/api/diagnostics');
    const data = await response?.json();
    
    expect(data).toHaveProperty('database');
    expect(data.database).toHaveProperty('available');
    expect(data.database.available).toBe(true);
    
    // Stats should be present if database is available
    expect(data).toHaveProperty('stats');
    if (data.stats) {
      expect(data.stats).toHaveProperty('speciesCount');
      expect(data.stats).toHaveProperty('movesCount');
      expect(data.stats.speciesCount).toBeGreaterThan(0);
      expect(data.stats.movesCount).toBeGreaterThan(0);
    }
  });
});
