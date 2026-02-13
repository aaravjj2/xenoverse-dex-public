import { test, expect } from '@playwright/test';

/**
 * Items page pagination and count validation
 */
test.describe('Items Page Validation', () => {
    test('header shows correct total count format', async ({ page }) => {
        await page.goto('/items');
        await page.waitForLoadState('networkidle');

        // Should show "All X items" when no filters
        await expect(page.getByText(/All \d+ items/).first()).toBeVisible();
    });

    test('header shows "Showing X of Y" with filters', async ({ page }) => {
        // Apply a filter (search for something)
        await page.goto('/items?search=berry');
        await page.waitForLoadState('networkidle');

        // Should show "Showing X of Y results for "berry""
        await expect(page.getByText(/Showing \d+ of \d+ results for "berry"/).first()).toBeVisible();
    });

    test('pagination works correctly', async ({ page }) => {
        await page.goto('/items');
        await page.waitForLoadState('networkidle');

        // Check pagination controls are present (if more than one page)
        const paginationExists = await page.getByText(/Page \d+ of \d+/).isVisible();

        if (paginationExists) {
            // Click next page
            await page.getByRole('link', { name: 'Next →' }).click();
            await page.waitForLoadState('networkidle');

            // URL should have page=2
            // URL should have page=2
            await expect(page).toHaveURL(/page=2/);
        }
    });

    test('total matches diagnostics count', async ({ page }) => {
        // Get items count from Items page
        await page.goto('/items');
        await page.waitForLoadState('networkidle');
        const itemsHeaderText = await page.getByText(/All \d+ items/).first().textContent();
        const itemsMatch = itemsHeaderText?.match(/All (\d+) items/);
        const itemsCount = itemsMatch ? parseInt(itemsMatch[1], 10) : 0;

        // Get items count from Diagnostics
        await page.goto('/diagnostics');
        await page.waitForLoadState('networkidle');

        // Find the Items count in diagnostics
        // Find the Items count in diagnostics
        // Filter for card that has "Items" AND a large text number (stats card), excluding exports list
        const itemsCard = page.locator('.bg-gray-800').filter({ hasText: 'Items' }).filter({ has: page.locator('.text-2xl') }).first();
        const itemsDiagText = await itemsCard.locator('.text-2xl').textContent();
        const diagCount = parseInt(itemsDiagText?.replace(/,/g, '') || '0', 10);

        // Counts should match
        expect(itemsCount).toBe(diagCount);
    });
});
