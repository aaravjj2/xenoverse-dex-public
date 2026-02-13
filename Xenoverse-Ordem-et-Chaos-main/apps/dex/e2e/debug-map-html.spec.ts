import { test, expect } from '@playwright/test';

test('debug world map HTML structure', async ({ page }) => {
  await page.goto('http://localhost:3001/world');
  await page.waitForLoadState('networkidle');

  // Check for the map container
  const mapContainer = page.locator('img[alt="Xenoverse World Map"]').locator('..');
  console.log('Map container HTML:', await mapContainer.innerHTML());

  // Check for any Links
  const allLinks = page.locator('a[href*="/world"]');
  const count = await allLinks.count();
  console.log(`Total links to /world: ${count}`);

  for (let i = 0; i < Math.min(count, 10); i++) {
    const link = allLinks.nth(i);
    const href = await link.getAttribute('href');
    const className = await link.getAttribute('class');
    console.log(`Link ${i}: href="${href}", class="${className}"`);
  }

  // Check for absolute positioned elements
  const absoluteElements = page.locator('.absolute');
  const absCount = await absoluteElements.count();
  console.log(`Absolute positioned elements: ${absCount}`);

  //Get page content
  const content = await page.content();
  console.log('MapCoordinates in page:', content.includes('MapCoordinates'));
  console.log('group cursor-pointer in page:', content.includes('group cursor-pointer'));
});
