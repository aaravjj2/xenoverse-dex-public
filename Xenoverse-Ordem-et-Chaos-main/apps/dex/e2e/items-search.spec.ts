import { test, expect } from '@playwright/test';

test.describe('Items Search Validation', () => {
    test('search logic works: empty -> partial -> empty', async ({ page }) => {
        await page.goto('/items');
        await page.waitForLoadState('networkidle');

        // Initial state
        await expect(page.getByText(/All \d+ items/)).toBeVisible();

        // Search for "ball" (assuming typical items exist)
        const searchInput = page.getByPlaceholder('Search items...');
        await searchInput.fill('ball');
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForLoadState('networkidle');

        // Expect specific header for search results
        // "Showing X of Y results for 'ball'"
        await expect(page.locator('h1')).toHaveText('Items');
        await expect(page.getByText(/results for "ball"/)).toBeVisible();

        // Search for nonexistent item
        await searchInput.fill('nonexistentitem12345');
        await page.getByRole('button', { name: 'Search' }).click();
        await page.waitForLoadState('networkidle');

        // Expect empty state
        await expect(page.getByText('No results for "nonexistentitem12345"')).toBeVisible();
        await expect(page.getByText('No items found matching your search')).toBeVisible();

        // Clear search using the "Clear" link/button
        await page.getByRole('link', { name: 'Clear', exact: true }).first().click(); // The header clear or filter clear
        await page.waitForLoadState('networkidle');

        // Expect return to "All X items"
        await expect(page.getByText(/All \d+ items/)).toBeVisible();
        await expect(searchInput).toHaveValue('');
    });
});
