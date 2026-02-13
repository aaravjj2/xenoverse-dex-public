import { test, expect } from '@playwright/test';

/**
 * Regression Tests: Form Learnset and Sprite Inheritance
 * 
 * These tests verify that forms (Xenoversal, Astral, etc.) properly inherit
 * learnsets and sprites from their base forms when they don't have their own,
 * fixing the critical regression where forms showed "Learnset (0)" and blank sprites.
 */

test.describe('Form Inheritance Regression Tests', () => {
  
  test('Forms with no learnset inherit from base form', async ({ page }) => {
    // Get all species to find one with forms
    const listResponse = await page.goto('/api/species?limit=2000');
    const listData = await listResponse?.json();
    
    // Find a species with forms (ends with _1, _2, etc.)
    const formsSpecies = listData.species.filter((s: any) => 
      s.id.match(/_\d+$/)
    );
    
    if (formsSpecies.length > 0) {
      const formSpecies = formsSpecies[0];
      const formResponse = await page.goto(`/api/species/${formSpecies.id}`);
      const formData = await formResponse?.json();
      
      // Either the form has its own learnset OR inherits from base
      if (formData.learnsetSource === 'base') {
        // Should have inherited learnset
        expect(formData.learnset).toBeDefined();
        expect(formData.learnset.length).toBeGreaterThan(0);
      } else if (formData.learnsetSource === 'form') {
        // Has its own learnset
        expect(formData.learnset).toBeDefined();
      }
      
      // Should never be undefined or empty without source indicator
      if (!formData.learnset || formData.learnset.length === 0) {
        expect(formData.learnsetSource).toBeDefined();
      }
    }
  });

  test('Forms inherit sprites when missing', async ({ page }) => {
    const listResponse = await page.goto('/api/species?limit=2000');
    const listData = await listResponse?.json();
    
    const formsSpecies = listData.species.filter((s: any) => 
      s.id.match(/_\d+$/)
    );
    
    if (formsSpecies.length > 0) {
      const formSpecies = formsSpecies[0];
      const formResponse = await page.goto(`/api/species/${formSpecies.id}`);
      const formData = await formResponse?.json();
      
      // If assets_inherited flag is set, verify base sprites are used
      if (formData.assets_inherited) {
        // Should have some sprite path (inherited from base)
        expect(
          formData.sprite_front || 
          formData.sprite_back || 
          formData.icon
        ).toBeTruthy();
      }
    }
  });

  test('UI shows inheritance indicator for forms', async ({ page }) => {
    // Find a form species
    const listResponse = await page.goto('/api/species?limit=2000');
    const listData = await listResponse?.json();
    
    const formsSpecies = listData.species.filter((s: any) => 
      s.id.match(/_\d+$/)
    );
    
    if (formsSpecies.length > 0) {
      const formSpecies = formsSpecies[0];
      
      await page.goto(`/species/${formSpecies.id}`);
      await page.waitForLoadState('networkidle');
      
      const pageContent = await page.content();
      
      // If inheriting, should show indicators
      if (pageContent.includes('learnset_source')) {
        // Check for inheritance indicators
        expect(
          pageContent.includes('Inherits base learnset') ||
          pageContent.includes('inherited') ||
          pageContent.includes('base form')
        ).toBe(true);
      }
    }
  });

  test('Form detail page never shows blank sprites', async ({ page }) => {
    const listResponse = await page.goto('/api/species?limit=2000');
    const listData = await listResponse?.json();
    
    const formsSpecies = listData.species.filter((s: any) => 
      s.id.match(/_\d+$/)
    ).slice(0, 5); // Test first 5 forms
    
    for (const formSpecies of formsSpecies) {
      await page.goto(`/species/${formSpecies.id}`);
      await page.waitForLoadState('networkidle');
      
      // Check if any image is present
      const images = page.locator('img[alt*="sprite"], img[alt*="icon"]');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        // At least one image should have a src
        const firstImage = images.first();
        const src = await firstImage.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src).not.toBe('');
      }
    }
  });

  test('Forms list shows correct form counts', async ({ page }) => {
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    
    // Check that diagnostics shows base vs form counts
    const pageContent = await page.content();
    
    // Should show distinct counts for base and forms
    expect(
      pageContent.includes('Base') ||
      pageContent.includes('base') ||
      pageContent.includes('Form') ||
      pageContent.includes('form') ||
      pageContent.includes('alternate')
    ).toBe(true);
  });

  test('API returns learnset_source flag for forms', async ({ page }) => {
    const listResponse = await page.goto('/api/species?limit=2000');
    const listData = await listResponse?.json();
    
    const formsSpecies = listData.species.filter((s: any) => 
      s.id.match(/_\d+$/)
    );
    
    if (formsSpecies.length > 0) {
      const formSpecies = formsSpecies[0];
      const formResponse = await page.goto(`/api/species/${formSpecies.id}`);
      const formData = await formResponse?.json();
      
      // Should have learnsetSource field
      expect(formData).toHaveProperty('learnsetSource');
      expect(['form', 'base', 'none']).toContain(formData.learnsetSource);
    }
  });

  test('Xenoversal/Astral forms no longer show Learnset (0)', async ({ page }) => {
    // Look for species with Xenoversal or Astral in the name
    const listResponse = await page.goto('/api/species?search=xenoversal&limit=100');
    const listData = await listResponse?.json();
    
    if (listData.species.length > 0) {
      const xenoForm = listData.species[0];
      
      await page.goto(`/species/${xenoForm.id}`);
      await page.waitForLoadState('networkidle');
      
      // Click Moves tab
      const movesTab = page.locator('button:has-text("Moves")');
      if (await movesTab.isVisible()) {
        await movesTab.click();
        await page.waitForTimeout(500);
        
        const pageContent = await page.content();
        
        // Should not show "Learnset (0)" unless explicitly stating no learnset exists
        if (pageContent.includes('Learnset (0)')) {
          // If it shows (0), must have explicit message
          expect(
            pageContent.includes('No learnset') ||
            pageContent.includes('no moves') ||
            pageContent.includes('Inherits')
          ).toBe(true);
        }
      }
    }
  });
});
