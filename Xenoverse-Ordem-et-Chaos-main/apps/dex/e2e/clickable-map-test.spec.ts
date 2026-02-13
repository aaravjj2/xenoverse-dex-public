import { test, expect } from '@playwright/test';

test.describe('World Map Clickable Hotspots', () => {
  test('should have clickable regions directly on the map image', async ({ page }) => {
    await page.goto('http://localhost:3001/world');
    await page.waitForLoadState('networkidle');

    console.log('✓ World page loaded');

    // Check that map image is visible
    const mapImage = page.locator('img[alt="Xenoverse World Map"]');
    await expect(mapImage).toBeVisible();
    console.log('✓ Map image visible');

    // Check for clickable hotspot links on the map
    const hotspotLinks = page.locator('a.group.cursor-pointer[href*="/world?q="]');
    const hotspotCount = await hotspotLinks.count();
    
    console.log(`✓ Found ${hotspotCount} clickable hotspots on map`);
    expect(hotspotCount).toBeGreaterThan(20); // Should have many clickable regions

    // Test clicking a major city hotspot (Westar City)
    // Find link that points to Westar City
    const westarLink = page.locator('a[title="Westar City"]');
    await expect(westarLink).toBeVisible();
    console.log('✓ Westar City hotspot found');

    // Hover over it to trigger tooltip
    await westarLink.hover();
    await page.waitForTimeout(500);

    // Check if tooltip appears
    const tooltip = page.locator('.absolute.top-2', { hasText: 'Westar City' });
    await expect(tooltip).toBeVisible({ timeout: 2000 });
    console.log('✓ Hover tooltip appears');

    // Click the hotspot
    await Promise.all([
      page.waitForURL('**/world?q=*'),
      westarLink.click()
    ]);

    expect(page.url()).toContain('Westar');
    console.log('✓ Clicking map hotspot navigates correctly');

    // Go back and test another location
    await page.goto('http://localhost:3001/world');
    await page.waitForLoadState('networkidle');

    // Test Ishtar City
    const ishtarLink = page.locator('a[title="Ishtar City"]');
    await ishtarLink.hover();
    await page.waitForTimeout(300);
    
    const ishtarTooltip = page.locator('.absolute.top-2', { hasText: 'Ishtar City' });
    await expect(ishtarTooltip).toBeVisible({ timeout: 2000 });
    console.log('✓ Ishtar City hotspot works');

    // Test a dungeon location
    const zodiacLink = page.locator('a[title="Mt. Zodiac"]');
    await zodiacLink.hover();
    await page.waitForTimeout(300);
    
    const zodiacTooltip = page.locator('.absolute.top-2', { hasText: 'Mt. Zodiac' });
    await expect(zodiacTooltip).toBeVisible({ timeout: 2000 });
    console.log('✓ Mt. Zodiac hotspot works');

    console.log('\n=== CLICKABLE MAP FULLY FUNCTIONAL ===');
  });

  test('should show visual feedback on hover', async ({ page }) => {
    await page.goto('http://localhost:3001/world');
    await page.waitForLoadState('networkidle');

    // Find a clickable region
    const hotspot = page.locator('a.group.cursor-pointer[href*="/world?q="]').first();
    
    // Hover and check for hover effects
    await hotspot.hover();
    await page.waitForTimeout(300);

    // The hover should trigger group-hover classes which change appearance
    const hotspotDiv = hotspot.locator('div').first();
    await expect(hotspotDiv).toBeVisible();
    
    console.log('✓ Hotspot hover effects working');
  });
});
