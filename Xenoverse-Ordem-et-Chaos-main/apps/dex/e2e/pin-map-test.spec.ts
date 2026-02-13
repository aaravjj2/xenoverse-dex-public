import { test, expect } from '@playwright/test';

test.describe('Pin-Based World Map Tests', () => {
    test('should display interactive pin markers on world map', async ({ page }) => {
        await page.goto('http://localhost:3001/world');
        await page.waitForLoadState('networkidle');
        
        console.log('[OK] World map page loaded');

        const mapImage = page.locator('img[alt="Xenoverse World Map"]');
        await expect(mapImage).toBeVisible({ timeout: 10000 });
        console.log('[OK] Map image visible');

        const pinMarkers = page.locator('div.rounded-full.border-2');
        const pinCount = await pinMarkers.count();
        console.log(`[OK] Found ${pinCount} pin markers on map`);
        expect(pinCount).toBeGreaterThan(30);

        const westarPin = page.locator('a[href*="Westar%20City"]').locator('div.rounded-full').first();
        await expect(westarPin).toBeVisible();
        console.log('[OK] Westar City pin found');

        await westarPin.hover();
        const tooltip = page.locator('text=Westar City').first();
        await expect(tooltip).toBeVisible({ timeout: 3000 });
        console.log('[OK] Pin hover shows tooltip');

        console.log('Clicking Westar City pin...');
        const westarLink = page.locator('a[href*="Westar%20City"]').first();
        await westarLink.click();
        await page.waitForURL('**/world?q=Westar%20City', { timeout: 5000 });
        console.log('[OK] Clicking pin navigates to location');

        console.log('=== PIN MAP FULLY FUNCTIONAL ===');
    });

    test('should highlight pins when searching', async ({ page }) => {
        await page.goto('http://localhost:3001/world');
        await page.waitForLoadState('networkidle');

        const searchBox = page.locator('input[placeholder*="Search locations"]');
        await searchBox.fill('City');
        console.log('[OK] Searched for City');

        const amberPins = page.locator('div.bg-amber-500.animate-bounce');
        const amberCount = await amberPins.count();
        console.log(`[OK] ${amberCount} pins highlighted in amber`);
        expect(amberCount).toBeGreaterThan(0);

        console.log('=== PIN SEARCH HIGHLIGHTING WORKS ===');
    });

    test('should show multiple pins across different locations', async ({ page }) => {
        await page.goto('http://localhost:3001/world');
        await page.waitForLoadState('networkidle');

        const testLocations = ['Ishtar City', 'Mt. Zodiac', 'Shinobi Island'];
        
        for (const location of testLocations) {
            const pin = page.locator(`a[href*="${encodeURIComponent(location)}"]`).locator('div.rounded-full').first();
            await expect(pin).toBeVisible();
            console.log(`[OK] ${location} pin visible`);
        }

        console.log('=== MULTIPLE PINS VERIFIED ===');
    });
});
