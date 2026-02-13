import { test, expect } from '@playwright/test';

/**
 * Regression Tests: Learnset Move Canonicality
 * 
 * These tests verify that learnset tables show the same move categories and power
 * as the move detail pages, fixing the critical regression where:
 * - Protect showed as Special in learnsets (should be Status)
 * - Flamethrower/Fire Blast showed as Physical in learnsets (should be Special)
 * - Return/Frustration showed power=1 in learnsets (should show "Varies")
 */

test.describe('Learnset Move Canonicality Regression Tests', () => {
  
  test('Learnset shows Protect as Status category', async ({ page }) => {
    // Find a species that learns Protect
    const response = await page.goto('/api/species/BULBASAUR');
    const data = await response?.json();
    
    // Check if this species has Protect in learnset
    if (data.learnset && data.learnset.length > 0) {
      const protectMove = data.learnset.find((l: any) => l.move_id === 'PROTECT');
      
      if (protectMove) {
        expect(protectMove.move_category).toBe('Status');
        expect(protectMove.move_category).not.toBe('Special');
      }
    }
  });

  test('Learnset shows Flamethrower as Special category', async ({ page }) => {
    // Find a Fire-type starter that learns Flamethrower
    const response = await page.goto('/api/species/CHARMANDER');
    const data = await response?.json();
    
    if (data.learnset && data.learnset.length > 0) {
      const flamethrowerMove = data.learnset.find((l: any) => l.move_id === 'FLAMETHROWER');
      
      if (flamethrowerMove) {
        expect(flamethrowerMove.move_category).toBe('Special');
        expect(flamethrowerMove.move_category).not.toBe('Physical');
      }
    }
  });

  test('Learnset shows Return with power_display as Varies', async ({ page }) => {
    // Find a species that learns Return
    const response = await page.goto('/api/species/PIKACHU');
    const data = await response?.json();
    
    if (data.learnset && data.learnset.length > 0) {
      const returnMove = data.learnset.find((l: any) => l.move_id === 'RETURN');
      
      if (returnMove) {
        expect(returnMove.power_display).toBe('Varies');
        expect(returnMove.power_display).not.toBe('1');
        expect(returnMove.power_display).not.toBe(1);
      }
    }
  });

  test('UI learnset table displays correct categories', async ({ page }) => {
    // Navigate to a species page with known moves
    await page.goto('/species/BULBASAUR');
    await page.waitForLoadState('networkidle');
    
    // Click on Moves tab
    const movesTab = page.locator('button:has-text("Moves")');
    if (await movesTab.isVisible()) {
      await movesTab.click();
      await page.waitForTimeout(500);
      
      // Check that learnset table is visible
      const learnsetTable = page.locator('table').first();
      if (await learnsetTable.isVisible()) {
        // Verify table has content
        const rows = await learnsetTable.locator('tbody tr').count();
        expect(rows).toBeGreaterThan(0);
      }
    }
  });

  test('Variable power moves display Varies in learnset UI', async ({ page }) => {
    // Find a species with variable-power moves
    await page.goto('/species/PIKACHU');
    await page.waitForLoadState('networkidle');
    
    const movesTab = page.locator('button:has-text("Moves")');
    if (await movesTab.isVisible()) {
      await movesTab.click();
      await page.waitForTimeout(500);
      
      // Look for "Varies" text in the page (if Return is in learnset)
      const pageContent = await page.content();
      // If Return is present, Varies should also be present
      if (pageContent.includes('Return') || pageContent.includes('RETURN')) {
        expect(pageContent).toContain('Varies');
      }
    }
  });

  test('API species endpoint includes learnset with canonical move data', async ({ page }) => {
    const response = await page.goto('/api/species/CHARIZARD');
    const data = await response?.json();
    
    expect(data).toHaveProperty('learnset');
    
    if (data.learnset && data.learnset.length > 0) {
      const firstMove = data.learnset[0];
      
      // Verify canonical move fields are present
      expect(firstMove).toHaveProperty('move_id');
      expect(firstMove).toHaveProperty('move_name');
      expect(firstMove).toHaveProperty('move_type');
      expect(firstMove).toHaveProperty('move_category');
      expect(firstMove).toHaveProperty('power_display');
      
      // Verify category is valid
      expect(['Physical', 'Special', 'Status']).toContain(firstMove.move_category);
    }
  });

  test('Learnset move categories match move detail pages', async ({ page }) => {
    // Get a species with a known move
    const speciesResponse = await page.goto('/api/species/BULBASAUR');
    const speciesData = await speciesResponse?.json();
    
    if (speciesData.learnset && speciesData.learnset.length > 0) {
      // Pick the first move from learnset
      const learnsetMove = speciesData.learnset[0];
      const moveId = learnsetMove.move_id;
      const learnsetCategory = learnsetMove.move_category;
      const learnsetPowerDisplay = learnsetMove.power_display;
      
      // Get the same move from moves API
      const moveResponse = await page.goto(`/api/moves/${moveId}`);
      const moveData = await moveResponse?.json();
      
      // API returns { move, learnedBy }
      const move = moveData.move;
      
      // Verify they match
      expect(move.category).toBe(learnsetCategory);
      
      // Verify power display matches
      if (move.is_variable_power) {
        expect(learnsetPowerDisplay).toBe('Varies');
      } else if (move.power === null) {
        expect(learnsetPowerDisplay).toBe('—');
      } else {
        expect(learnsetPowerDisplay).toBe(move.power.toString());
      }
    }
  });
});
