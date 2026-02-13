
import { test, expect } from '@playwright/test';

test('Compare page images should load fallback correctly', async ({ page }) => {
    // Go to Compare page
    await page.goto('http://localhost:3001/compare');

    // Wait for the species selector to be visible
    const selector = page.getByPlaceholder('Search Pokémon 1...');
    await expect(selector).toBeVisible();

    // Focus and type
    await selector.click();
    await selector.fill('Charizard');

    // Check for loading state or results
    // Use a very permissive wait for any result button
    const result = page.locator('button').filter({ hasText: 'Charizard' }).first();
    await expect(result).toBeVisible({ timeout: 15000 });

    // Click result
    await result.click();

    // Wait for the species icon in the first slot
    // The first slot is inside a border-blue-500 container
    const slot1 = page.locator('.border-blue-500\\/50').first();
    await expect(slot1).toBeVisible();

    // Find the image inside slot 1
    const img = slot1.locator('img');
    await expect(img).toBeVisible();

    const boxValidation = await img.evaluate((el) => {
        return {
            naturalWidth: (el as HTMLImageElement).naturalWidth,
            complete: (el as HTMLImageElement).complete,
            src: (el as HTMLImageElement).src,
            visible: (el as HTMLElement).offsetParent !== null
        };
    });
    console.log('Image properties:', boxValidation);

    expect(boxValidation.complete).toBe(true);
    expect(boxValidation.naturalWidth).toBeGreaterThan(0);
    expect(boxValidation.src).toMatch(/raw\.githubusercontent\.com|\/Graphics\//i);
});
