import { test, expect } from '@playwright/test';

test.describe('World (Derived) Page', () => {
    test('should load the world page and show facts', async ({ page }) => {
        await page.goto('http://localhost:3001/world');

        // Check header
        await expect(page.locator('h1')).toContainText('World');
        await expect(page.getByText('Layer B: Derived')).toBeVisible();

        // Check table headers
        await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Entity' })).toBeVisible();

        // Check for at least one item_location fact
        const itemRow = page.getByRole('row').filter({ hasText: 'item location' }).first();
        await expect(itemRow).toBeVisible();
    });

    test('should filter facts by type', async ({ page }) => {
        await page.goto('http://localhost:3001/world');

        // Filter by shop
        await page.locator('select[name="type"]').selectOption('shop');
        await page.getByRole('button', { name: 'Filter' }).click();

        // Verify results
        const rows = page.getByRole('row').filter({ hasText: 'item location' });
        await expect(rows).toHaveCount(0);

        const shopRows = page.getByRole('row').filter({ hasText: 'shop' });
        // Check if there's at least one shop (should be 81 total)
        await expect(shopRows.first()).toBeVisible();
    });

    test('should open provenance panel on row click', async ({ page }) => {
        await page.goto('http://localhost:3001/world');

        // Click the first fact row
        const firstRow = page.getByRole('row').nth(1); // 0 is header
        await firstRow.click();

        // Check panel
        await expect(page.getByRole('heading', { name: 'Provenance' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Location' })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Raw Snippet' })).toBeVisible();

        // Test copy buttons exist
        await expect(page.getByRole('button', { name: 'Copy Provenance' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Copy Snippet' })).toBeVisible();

        // Close panel
        await page.getByRole('button', { name: '×' }).click();
        await expect(page.getByRole('heading', { name: 'Provenance' })).not.toBeVisible();
    });
});
