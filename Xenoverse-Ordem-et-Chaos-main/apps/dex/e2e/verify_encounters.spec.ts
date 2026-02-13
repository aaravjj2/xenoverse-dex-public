
import { test, expect } from '@playwright/test';

test('verify encounter locations tab and data', async ({ page }) => {
    // Go to Carvanha's page (known to have encounters in encounters.dat based on my earlier debug)
    // Carvanha ID is likely CARVANHA
    await page.goto('http://localhost:3001/species/CARVANHA');

    // Check if Locations tab exists
    const locationsTab = page.getByRole('button', { name: /Locations \(\d+\)/ });
    await expect(locationsTab).toBeVisible();

    // Click the tab
    await locationsTab.click();

    // Verify EncounterTable is visible
    await expect(page.getByText('Locations', { exact: true })).toBeVisible(); // Header in EncounterTable

    // Verify specific map data
    // Based on debug output: Map 667 (likely named in MapInfos) has Carvanha
    // I should check for *any* map section being visible
    const mapSection = page.locator('.bg-gray-800').filter({ hasText: /Map|Route/ }).first();
    await expect(mapSection).toBeVisible();

    // Verify encounter method and chance
    await expect(page.getByText('OldRod').first()).toBeVisible();
    // await expect(page.getByText('%')).toBeVisible(); 
});
