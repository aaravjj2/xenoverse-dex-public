import { test, expect } from '@playwright/test';

test.describe('Debug Compare and Map Features', () => {
  test('should fully test compare feature with real interaction', async ({ page }) => {
    await page.goto('http://localhost:3001/compare');
    await page.waitForLoadState('networkidle');

    // Check page loaded
    await expect(page.locator('h1:has-text("Compare Pokémon")')).toBeVisible();
    console.log('✓ Compare page loaded');

    // Type in first search box
    const search1 = page.locator('input[placeholder*="Search Pokémon 1"]');
    await expect(search1).toBeVisible();
    await search1.click();
    await search1.fill('pikachu');
    await page.waitForTimeout(500); // Wait for debounce

    // Check if results appear
    const results1 = page.locator('.absolute.top-full button').first();
    await expect(results1).toBeVisible({ timeout: 5000 });
    console.log('✓ Search results appeared for slot 1');

    // Click first result
    await results1.click();
    await page.waitForTimeout(500);

    // Check if Pikachu was selected
    const species1 = page.locator('.bg-gray-800.rounded-lg.p-4').first();
    await expect(species1).toContainText('Pikachu', { timeout: 5000 });
    console.log('✓ Pikachu selected in slot 1');

    // Type in second search box
    const search2 = page.locator('input[placeholder*="Search Pokémon 2"]');
    await expect(search2).toBeVisible();
    await search2.click();
    await search2.fill('charizard');
    await page.waitForTimeout(500);

    // Check if results appear for slot 2
    const results2 = page.locator('.absolute.top-full button').first();
    await expect(results2).toBeVisible({ timeout: 5000 });
    console.log('✓ Search results appeared for slot 2');

    // Click first result
    await results2.click();
    await page.waitForTimeout(500);

    // Check if Charizard was selected
    const species2 = page.locator('.bg-gray-800.rounded-lg.p-4').last();
    await expect(species2).toContainText('Charizard', { timeout: 5000 });
    console.log('✓ Charizard selected in slot 2');

    // Check if comparison section is shown
    await expect(page.locator('h2:has-text("Stat Comparison")')).toBeVisible();
    console.log('✓ Stat comparison section visible');

    // Check stat bars are rendered
    const statBars = page.locator('.h-4:has(.rounded-l)');
    const count = await statBars.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ ${count} stat comparison bars rendered`);

    // Check abilities are shown
    await expect(page.locator('h3:has-text("Abilities")')).toHaveCount(2);
    console.log('✓ Abilities sections visible for both Pokémon');

    // Try to clear selection
    const clearButton = page.locator('button:has-text("×")').first();
    if (await clearButton.isVisible()) {
      await species1.hover();
      await page.waitForTimeout(300);
      await clearButton.click();
      await page.waitForTimeout(300);
      await expect(search1).toBeVisible();
      console.log('✓ Clear button works');
    }
  });

  test('should test world map clickable functionality', async ({ page }) => {
    await page.goto('http://localhost:3001/world');
    await page.waitForLoadState('networkidle');

    // Check InteractiveWorldMap is rendered
    await expect(page.locator('img[alt="Xenoverse World Map"]')).toBeVisible();
    console.log('✓ World map image visible');

    // Check search box is present
    const searchBox = page.locator('input[placeholder*="Search locations"]');
    await expect(searchBox).toBeVisible();
    console.log('✓ Location search box visible');

    // Test search functionality
    await searchBox.fill('Westar City');
    await page.waitForTimeout(300);

    // Check if search shows results
    const searchResults = page.locator('h3:has-text("Search Results")');
    await expect(searchResults).toBeVisible();
    console.log('✓ Search results header visible');

    // Check if clickable link appears
    const locationLink = page.locator('a:has-text("Westar City")').first();
    await expect(locationLink).toBeVisible();
    console.log('✓ Clickable location link found');

    // Click the link
    console.log('Clicking location link...');
    await Promise.all([
      page.waitForURL('**/world?q=*'),
      locationLink.click()
    ]);

    // Check URL changed
    expect(page.url()).toContain('q=Westar');
    console.log('✓ Clicking location link navigates correctly');

    // Go back and test category tabs
    await page.goto('http://localhost:3001/world');
    await page.waitForLoadState('networkidle');

    // Check category buttons
    const categoryButton = page.locator('button:has-text("Major Cities")').first();
    await expect(categoryButton).toBeVisible();
    console.log('✓ Category buttons visible');

    // Click category
    await categoryButton.click();
    await page.waitForTimeout(300);

    // Check if locations appear
    const categoryLocations = page.locator('a:has-text("Westar City")');
    const locCount = await categoryLocations.count();
    expect(locCount).toBeGreaterThan(0);
    console.log(`✓ ${locCount} clickable locations shown in category`);

    // Test clicking a location from category
    await Promise.all([
      page.waitForURL('**/world?q=*'),
      categoryLocations.first().click()
    ]);
    expect(page.url()).toContain('q=Westar');
    console.log('✓ Category location links work');
  });
});
