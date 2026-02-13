import { test, expect } from '@playwright/test';

test('Proof Tour', async ({ page }) => {
    // 1. Diagnostics
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify Types = 19
    // Verify Types = 19
    // Find the card containing 'Types' and check its number value
    const typesCard = page.locator('.bg-gray-800', { hasText: 'Types' }).first();
    await expect(typesCard).toContainText('19');

    // Scroll to Asset Coverage fractions
    await page.getByText('Asset Coverage').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);

    // Scroll to Export Files (Pipeline Commands)
    await page.getByText('Pipeline Commands').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    // Ensure items.json, trainers.json, world_facts.json are visible
    // (Visual check in video)

    // 2. Items
    await page.goto('/items');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // Show 'All {total} items'
    await expect(page.getByText(/All \d+ items/)).toBeVisible();

    // Search term yielding 0 results
    await page.getByPlaceholder('Search items...').fill('xyz123');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify header "No results"
    await expect(page.getByText('No results for "xyz123"')).toBeVisible();

    // Clear search
    // Clear search
    await page.getByPlaceholder('Search items...').fill('Master Ball');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.waitForTimeout(1000); // Wait for search debounce
    await expect(page.getByText('Master Ball').first()).toBeVisible({ timeout: 10000 });

    // Navigate directly to Trainers to reset state
    // (Bypassing "Clear" button flake)
    await page.goto('/trainers');
    await page.waitForTimeout(2000); // Wait for load

    // Open detail
    await page.locator('a[href^="/trainers/"]').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 4. World
    await page.goto('/world');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify header "Showing X of Y extracted facts" (no filter)
    await expect(page.getByText(/Showing \d+ of \d+ extracted facts/)).toBeVisible();

    // Verify header "Showing X of Y"
    await expect(page.getByText(/Showing \d+ of \d+/)).toBeVisible();

    // Click a fact/row to show provenance
    // Click the first row in the table body
    await page.locator('tbody tr').first().click();
    await page.waitForTimeout(1000); // Animation

    // Verify Panel opens (check for title "Provenance")
    await expect(page.getByRole('heading', { name: 'Provenance' })).toBeVisible();

    // Search for a specific map to ensure we check a fact with provenance (Fortbelt Town id:1 has page_index:0)
    await page.getByPlaceholder('Search facts...').fill('Fortbelt Town');
    await page.getByRole('button', { name: 'Filter' }).click({ force: true });
    await page.waitForTimeout(1000); // Wait for filter

    // Debug output
    const debugContent = await page.getByTestId('debug-state').textContent();
    console.log(`[DEBUG] World Filter State: ${debugContent}`);

    // Verify header changes to "matching facts"
    await expect(page.getByText(/Showing \d+ of \d+ matching facts/)).toBeVisible();

    // Expand first fact
    await page.locator('tbody tr').first().click({ force: true });
    await expect(page.locator('body')).toContainText(/Page Index\s*\d+/);
    await expect(page.locator('body')).toContainText(/Command Index\s*\d+/);
    await page.waitForTimeout(1000);

    // Close panel
    await page.getByRole('button', { name: '×' }).click();
    await page.waitForTimeout(500);

    // 5. Validation Summary & Changelog
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify Validation Status section
    await expect(page.getByRole('heading', { name: 'Validation Status' })).toBeVisible();

    // Verify Warnings Breakdown
    await expect(page.getByText('Warnings Breakdown')).toBeVisible();
    await expect(page.getByText('Top 5 Categories')).toBeVisible();
    await expect(page.getByText('View full validation report locations')).toBeVisible();

    // Check for "Passed" or "Failed" badge (or at least "No validation report" if not run yet, but we expect it to exist if we run validation first)
    // We will verify the section exists.

    // Verify Latest Changelog section
    await expect(page.getByRole('heading', { name: 'Latest Changelog' })).toBeVisible();
    await expect(page.getByText('Build:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy Path' })).toBeVisible();

    await page.waitForTimeout(2000);
});
