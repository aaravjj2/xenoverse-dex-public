import { test, expect } from '@playwright/test';

test('Record Demo Clip', async ({ page }) => {
    // 1. Pokedex (Home)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Check for the main grid of Pokemon
    await expect(page.locator('.grid').first()).toBeVisible();
    await page.waitForTimeout(4000); // Read time

    // 2. Types
    await page.goto('/types');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Type Chart' })).toBeVisible();
    await page.waitForTimeout(4000); // Read time

    // 3. World Page & Provenance
    await page.goto('/world');
    await page.waitForLoadState('networkidle');

    // Filter
    await page.getByPlaceholder('Search facts...').fill('Fortbelt Town');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'Filter' }).click({ force: true });
    await page.waitForTimeout(3000); // Show results

    // Expand fact
    await page.locator('tbody tr').first().click({ force: true });
    await page.waitForTimeout(1000);

    // Provenance Panel
    await expect(page.getByRole('heading', { name: 'Provenance' })).toBeVisible();
    await page.waitForTimeout(5000); // Read provenance
});
