import { test, expect } from '@playwright/test';

test('In-Depth Feature Tour', async ({ page }) => {
    // Increase timeout for a long, slow tour
    test.setTimeout(180000);

    // 1. Diagnostics & Health Check (Milestone 2)
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Diagnostics');
    await page.waitForTimeout(4000); // 4s

    // Show the new counts
    const main = page.getByRole('main');
    await expect(main.getByText('Items', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('Trainers', { exact: true }).first()).toBeVisible();
    await expect(main.getByText('World Facts', { exact: true }).first()).toBeVisible();
    await page.waitForTimeout(4000); // 8s total

    // 2. Items Gallery (Milestone 1)
    await page.click('a[href="/items"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Items');
    await page.waitForTimeout(3000); // 11s total

    // Showcase pocket filtering
    await page.selectOption('select', '5'); // TMs & HMs
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(5000); // 16s total

    // 3. Item Detail & Derived Facts (Milestone 1)
    await page.fill('input[placeholder*="Search items"]', 'TM01');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(3000);
    await page.getByRole('link').filter({ hasText: /^TM01$/ }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Locations/i).first()).toBeVisible();
    await page.waitForTimeout(5000); // 21s total

    // 4. Trainers & Location Badges (Milestone 1)
    await page.click('a[href="/trainers"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Trainers');
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(5000); // 26s total

    // 5. Trainer Detail (Milestone 1)
    await page.click('text=CLOVER');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Party/i).first()).toBeVisible();
    await page.waitForTimeout(5000); // 31s total

    // 6. THE WORLD PAGE (Milestones 1 & 4)
    await page.click('a[href="/world"]');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('World');
    await page.waitForTimeout(4000); // 35s total

    // A. Item Locations
    await page.selectOption('select[name="type"]', 'item_location');
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(5000); // 40s total

    // B. Provenance
    const itemRow = page.getByRole('row').filter({ hasText: /item_location/i }).first();
    await itemRow.click();
    await expect(page.getByRole('heading', { name: 'Provenance' }).first()).toBeVisible();
    await page.waitForTimeout(6000); // 46s total
    await page.click('button:has-text("×")');

    // C. Shops
    await page.selectOption('select[name="type"]', 'shop');
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(5000); // 51s total

    // D. Trainer Locations (Milestone 4)
    await page.selectOption('select[name="type"]', 'trainer_location');
    await page.click('button:has-text("Filter")');
    await page.waitForTimeout(6000); // 57s total

    // Double Battle Trainer
    const doubleRow = page.getByRole('row').filter({ hasText: /Double/ }).first();
    await doubleRow.click();
    await page.waitForTimeout(2000);
    await expect(page.getByRole('heading', { name: 'Payload' }).first()).toBeVisible();
    await page.waitForTimeout(8000); // 67s total

    // Conclusion
    await page.click('text=Xenoverse Dex');
    await page.waitForTimeout(5000); // 72s total
});
