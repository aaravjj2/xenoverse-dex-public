import { test, expect } from '@playwright/test';

test('Verify Type Updates', async ({ page }) => {
    // 1. Check Home Page Filters
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'SOUND' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'COSMIC' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'SHADOW' })).not.toBeVisible();

    // 2. Check Moves Page Filters
    await page.goto('/moves');
    const typeSelect = page.getByRole('combobox').nth(0); // First select is Type

    // Verify options
    const options = await typeSelect.locator('option').allInnerTexts();
    expect(options).toContain('SOUND');
    expect(options).not.toContain('COSMIC');
    expect(options).not.toContain('SHADOW');
});
