import { test, expect } from '@playwright/test';

/**
 * Regression test: Asset coverage percentages must NEVER exceed 100%
 */
test.describe('Diagnostics Coverage Validation', () => {
    test('asset coverage percentages are always <= 100', async ({ page }) => {
        await page.goto('/diagnostics');
        await page.waitForLoadState('networkidle');

        // Wait for data to load
        await expect(page.locator('h1')).toContainText('Diagnostics');

        // Get the coverage section
        const coverageSection = page.locator('text=Asset Coverage').locator('..');

        // Find all percentage displays - they should show "X / Y (Z%)"
        const coverageTexts = await coverageSection.locator('span').allTextContents();

        // Look for pattern like "XXX / YYY (ZZ%)"
        const percentPattern = /\((\d+)%\)/;
        let foundPercentages = false;

        for (const text of coverageTexts) {
            const match = text.match(percentPattern);
            if (match) {
                const percent = parseInt(match[1], 10);
                expect(percent).toBeLessThanOrEqual(100);
                expect(percent).toBeGreaterThanOrEqual(0);
                foundPercentages = true;
            }
        }

        // Verify we actually found percentage values to check
        expect(foundPercentages).toBe(true);
    });

    test('coverage format shows fraction with percentage', async ({ page }) => {
        await page.goto('/diagnostics');
        await page.waitForLoadState('networkidle');

        // Each coverage bar should show format: "X / Y (Z%)"
        // Check that we have at least one coverage display in correct format
        await expect(page.getByText(/\d+ \/ \d+ \(\d+%\)/).first()).toBeVisible();
    });
});
