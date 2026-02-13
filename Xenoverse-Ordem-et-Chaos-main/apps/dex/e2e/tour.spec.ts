import { test, expect } from '@playwright/test';

test('Comprehensive Application Tour', async ({ page }) => {
    // 1. Home Page - Initial View
    await page.goto('/');
    await expect(page.getByText('Xenoverse Dex')).toBeVisible();
    await page.waitForTimeout(1500); // Pause for viewer to see

    // 2. Filters & Search interaction
    // Filter by Type: FIRE
    await page.getByRole('button', { name: 'FIRE' }).click();
    await page.waitForTimeout(1000);

    // Search for species: Charizard
    await page.getByRole('textbox', { name: 'Name or ID...' }).fill('Charizard');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Charizard')).toBeVisible();

    // Clear filters
    await page.getByRole('button', { name: 'Clear All' }).click();
    await page.waitForTimeout(1000);

    // 3. Species Detail View
    // Search for Aegislash (to show fixed sprite)
    await page.getByRole('textbox', { name: 'Name or ID...' }).fill('Aegislash');
    await page.waitForTimeout(1000);
    await page.getByRole('link', { name: 'Aegislash' }).click();
    await expect(page.getByRole('heading', { name: 'Aegislash' })).toBeVisible();
    await page.waitForTimeout(2000); // Pause to admire the fixed sprite

    // Check Learnset
    await page.getByRole('button', { name: /Learnset/ }).click();
    await page.waitForTimeout(1500);

    // Scroll moves
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    // 4. Navigation: Moves Page
    await page.getByRole('link', { name: 'Moves' }).click();
    await expect(page.getByRole('heading', { name: 'Moves' })).toBeVisible();
    await page.waitForTimeout(1500);

    // Filter Moves
    await page.getByRole('combobox').filter({ hasText: 'All Types' }).selectOption('FIRE');
    await page.waitForTimeout(1000);
    await page.getByRole('combobox').filter({ hasText: 'All Categories' }).selectOption('Special');
    await page.waitForTimeout(1000);

    // Click a move (e.g. Flamethrower or anything visible)
    // We'll just pick the first visible link in the grid that isn't a nav link
    // Or just reset filters
    await page.getByRole('button', { name: 'Clear' }).click();
    await page.waitForTimeout(1000);

    // 5. Navigation: Types Page
    await page.getByRole('link', { name: 'Types' }).click();
    await expect(page.getByRole('heading', { name: 'Type Chart' })).toBeVisible();
    await page.waitForTimeout(2000);

    // Click a Type (Dark) to see details
    await page.getByRole('link', { name: 'DAR' }).click();
    await expect(page.getByRole('heading', { name: 'Dark' })).toBeVisible();
    await page.waitForTimeout(1500);

    // 6. Navigation: Abilities Page
    await page.getByRole('link', { name: 'Abilities' }).click();
    await expect(page.getByRole('heading', { name: 'Abilities' })).toBeVisible();
    await page.waitForTimeout(1500);

    // Search Ability
    await page.getByPlaceholder('Search abilities...').fill('Levitate');
    await page.waitForTimeout(1000);

    // 7. Navigation: Compare Page
    await page.getByRole('link', { name: 'Compare' }).click();

    // Compare Darkrai vs Cresselia
    await page.getByPlaceholder('Search Pokémon 1...').fill('Darkrai');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Darkrai' }).first().click();

    await page.getByPlaceholder('Search Pokémon 2...').fill('Cresselia');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Cresselia' }).first().click();

    await page.waitForTimeout(2000); // View comparison

    // 8. Back to Home
    await page.getByRole('link', { name: 'Pokédex' }).first().click();
    await page.waitForTimeout(1000);
});
