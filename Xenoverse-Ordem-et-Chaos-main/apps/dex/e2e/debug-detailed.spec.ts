import { test, expect } from '@playwright/test';

test('debug compare - check console errors', async ({ page }) => {
  const consoleMessages: string[] = [];
  const errors: string[] = [];
  const apiRequests: string[] = [];

  // Set up listeners BEFORE navigation
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(text);
    console.log(text);
  });

  page.on('pageerror', err => {
    const text = `PAGE ERROR: ${err.message}`;
    errors.push(text);
    console.log(text);
  });

  page.on('request', request => {
    if (request.url().includes('/api/')) {
      const msg = `REQUEST: ${request.method()} ${request.url()}`;
      apiRequests.push(msg);
      console.log(msg);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      const url = response.url();
      let body = '';
      try {
        body = await response.text();
      } catch {}
      const msg = `RESPONSE: ${status} ${url} - ${body.slice(0, 200)}`;
      apiRequests.push(msg);
      console.log(msg);
    }
  });

  await page.goto('http://localhost:3001/compare');
  await page.waitForLoadState('networkidle');

  console.log('\n=== Testing Compare Feature ===\n');

  // Type in first search
  const search1 = page.locator('input[placeholder*="Search Pokémon 1"]');
  await search1.click();
  await search1.fill('pikachu');
  await page.waitForTimeout(1000); // Wait for debounce + search

  // Wait for search results
  try {
    await page.waitForSelector('.absolute.top-full button', { timeout: 5000 });
    console.log('✓ Search results appeared');

    // Get the first result's info
    const firstResult = page.locator('.absolute.top-full button').first();
    const resultText = await firstResult.textContent();
    console.log(`First result text: "${resultText}"`);

    // Click it
    console.log('Clicking first result...');
    await firstResult.click({force: true});
    await page.waitForTimeout(1000);

    // Check if species was selected
    const species1Container = page.locator('.bg-gray-800.rounded-lg.p-4').first();
    const containerText = await species1Container.textContent();
    console.log(`Container text after click: "${containerText}"`);

  } catch (e) {
    console.log(`ERROR: ${e}`);
  }

  console.log('\n=== Console Messages ===');
  consoleMessages.forEach(msg => console.log(msg));

  console.log('\n=== Errors ===');
  errors.forEach(err => console.log(err));

  await page.waitForTimeout(2000);

  console.log('\n=== API Requests ===');
  apiRequests.forEach(req => console.log(req));
});

test('debug world map - check navigation', async ({ page }) => {
  const navigationEvents: string[] = [];

  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      navigationEvents.push(`NAVIGATED TO: ${frame.url()}`);
      console.log(`NAVIGATED TO: ${frame.url()}`);
    }
  });

  console.log('\n=== Testing World Map===\n');

  await page.goto('http://localhost:3001/world');
  await page.waitForLoadState('networkidle');

  console.log('✓ World page loaded');

  // Test search
  const searchBox = page.locator('input[placeholder*="Search locations"]');
  await searchBox.fill('Westar City');
  await page.waitForTimeout(500);
  console.log('✓ Search filled');

  // Find the link
  const locationLink = page.locator('a:has-text("Westar City")').first();
  await expect(locationLink).toBeVisible();
  
  const href = await locationLink.getAttribute('href');
  console.log(`Link href attribute: "${href}"`);

  // Click it
  console.log('Clicking location link...');
  await locationLink.click();
  await page.waitForTimeout(1000);

  console.log(`Final URL: ${page.url()}`);

  console.log('\n=== Navigation Events ===');
  navigationEvents.forEach(evt => console.log(evt));
});
