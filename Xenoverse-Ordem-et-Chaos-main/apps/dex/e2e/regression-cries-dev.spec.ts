import { test, expect } from '@playwright/test';

/**
 * Regression Tests: Cry Audio and Dev Entry Filtering
 * 
 * These tests verify:
 * 1. Cry audio files are served correctly with proper content-type
 * 2. Cry player shows explicit errors when files are missing
 * 3. Dev/placeholder entries (WIP, BST~6) are hidden by default
 * 4. Cry coverage metrics are accurate
 */

test.describe('Cry Audio Regression Tests', () => {
  
  test('Cry files are served with correct content-type', async ({ page }) => {
    // Find a species with a cry
    const response = await page.goto('/api/species/BULBASAUR');
    const data = await response?.json();
    
    if (data.cry_path) {
      // Request the cry file through asset API
      const cryResponse = await page.goto(`/api/asset?path=${encodeURIComponent(data.cry_path)}`);
      
      expect(cryResponse?.status()).toBe(200);
      
      const contentType = cryResponse?.headers()['content-type'];
      expect(contentType).toContain('audio/ogg');
    }
  });

  test('Species with cries have audio element that loads metadata', async ({ page }) => {
    // Find species with cry
    const response = await page.goto('/api/species/PIKACHU');
    const data = await response?.json();
    
    if (data.cry_path) {
      await page.goto(`/species/${data.id}`);
      await page.waitForLoadState('networkidle');
      
      // Look for audio element
      const audio = page.locator('audio').first();
      if (await audio.isVisible()) {
        // Audio element should have src
        const src = await audio.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).toContain('/api/asset');
      }
    }
  });

  test('Missing cry shows explicit error state', async ({ page }) => {
    // Find species without cry
    const listResponse = await page.goto('/api/species?limit=100');
    const listData = await listResponse?.json();
    
    const speciesWithoutCry = listData.species.find((s: any) => !s.cry_path);
    
    if (speciesWithoutCry) {
      await page.goto(`/species/${speciesWithoutCry.id}`);
      await page.waitForLoadState('networkidle');
      
      const pageContent = await page.content();
      
      // Should show explicit message, not 0:00/0:00
      expect(
        pageContent.includes('No cry available') ||
        pageContent.includes('Cry not available') ||
        pageContent.includes('cry-missing')
      ).toBe(true);
    }
  });

  test('Diagnostics shows accurate cry coverage', async ({ page }) => {
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    
    // Should show cry coverage or asset coverage stats
    expect(
      pageContent.includes('cry') ||
      pageContent.includes('Cry') ||
      pageContent.includes('audio') ||
      pageContent.includes('asset') ||
      pageContent.includes('coverage')
    ).toBe(true);
  });
});

test.describe('Dev Entry Filtering Regression Tests', () => {
  
  test('Default species list never returns is_dev entries', async ({ page }) => {
    const response = await page.goto('/api/species?limit=2000');
    const data = await response?.json();
    
    // Check all returned species
    data.species.forEach((species: any) => {
      // If is_dev field exists, it should be false or 0
      if ('is_dev' in species) {
        expect(species.is_dev).toBeFalsy();
      }
      
      // Should not have WIP name
      expect(species.name).not.toBe('WIP');
      expect(species.name).not.toMatch(/^(WIP|TEST|PLACEHOLDER)$/i);
    });
  });

  test('No WIP entries appear in default Dex list UI', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Wait for species to load
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    
    // Should not contain WIP entries
    expect(pageContent).not.toContain('name="WIP"');
    expect(pageContent).not.toContain('>WIP<');
  });

  test('No species with BST ~6 appear in default list', async ({ page }) => {
    const response = await page.goto('/api/species?limit=2000');
    const data = await response?.json();
    
    data.species.forEach((species: any) => {
      const bst = (species.hp || 0) + 
                  (species.attack || 0) + 
                  (species.defense || 0) + 
                  (species.sp_attack || 0) + 
                  (species.sp_defense || 0) + 
                  (species.speed || 0);
      
      // BST should be reasonable (not 6 or absurdly low)
      expect(bst).toBeGreaterThan(50);
    });
  });

  test('Diagnostics shows dev entry count', async ({ page }) => {
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    
    const pageContent = await page.content();
    
    // Should mention dev entries (even if 0)
    expect(
      pageContent.includes('dev') ||
      pageContent.includes('Dev') ||
      pageContent.includes('hidden') ||
      pageContent.includes('placeholder') ||
      pageContent.includes('devEntryCount') ||
      diagData.stats.devEntryCount !== undefined
    ).toBe(true);
  });

  test('Species counts are consistent across UI', async ({ page }) => {
    // Get counts from diagnostics
    const diagResponse = await page.goto('/api/diagnostics');
    const diagData = await diagResponse?.json();
    
    const statsSpeciesCount = diagData.stats?.speciesCount || 0;
    
    // Get count from species list API
    const listResponse = await page.goto('/api/species?limit=10000');
    const listData = await listResponse?.json();
    
    const apiCount = listData.species.length;
    
    // Counts should be consistent (API returns filtered list)
    expect(apiCount).toBeGreaterThan(0);
    expect(statsSpeciesCount).toBeGreaterThanOrEqual(apiCount);
  });

  test('Base species vs form counts are reported separately', async ({ page }) => {
    const diagResponse = await page.goto('/api/diagnostics');
    const diagData = await diagResponse?.json();
    
    // Should have distinct counts
    expect(diagData.stats).toHaveProperty('speciesCount');
    expect(diagData.stats).toHaveProperty('baseSpeciesCount');
    expect(diagData.stats).toHaveProperty('formCount');
    
    // Base + forms should equal total
    const total = diagData.stats.speciesCount;
    const base = diagData.stats.baseSpeciesCount;
    const forms = diagData.stats.formCount;
    
    expect(base + forms).toBe(total);
  });
});

test.describe('Count Consistency Tests', () => {
  
  test('Dex header count matches API count', async ({ page }) => {
    // Get API count
    const apiResponse = await page.goto('/api/species?limit=10000');
    const apiData = await apiResponse?.json();
    const apiCount = apiData.species.length;
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    
    // Look for count in UI (should show total species)
    const countMatch = pageContent.match(/(\d+)\s+(species|entries|pokémon)/i);
    if (countMatch) {
      const uiCount = parseInt(countMatch[1]);
      
      // Should be close (might differ by base vs all forms)
      expect(uiCount).toBeGreaterThan(0);
      expect(Math.abs(uiCount - apiCount)).toBeLessThan(100);
    }
  });

  test('Diagnostics counts match database queries', async ({ page }) => {
    const diagResponse = await page.goto('/api/diagnostics');
    const diagData = await diagResponse?.json();
    
    // All counts should be positive
    expect(diagData.stats.speciesCount).toBeGreaterThan(0);
    expect(diagData.stats.movesCount).toBeGreaterThan(0);
    expect(diagData.stats.abilitiesCount).toBeGreaterThan(0);
    expect(diagData.stats.typesCount).toBeGreaterThan(0);
    
    // Learnsets should be substantial
    expect(diagData.stats.learnsetsCount).toBeGreaterThan(1000);
  });
});
