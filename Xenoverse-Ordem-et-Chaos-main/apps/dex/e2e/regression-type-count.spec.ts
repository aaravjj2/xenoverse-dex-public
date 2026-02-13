import { test, expect } from '@playwright/test';

test.describe('Type Count Consistency', () => {
  test('Type Chart should render same number of types as Diagnostics', async ({ page }) => {
    // Go to diagnostics and get type count
    await page.goto('/diagnostics');
    await page.waitForSelector('text=Diagnostics');
    
    // Look for the "Types" label and get its parent div's number
    const typesSection = page.locator('div.text-gray-400:has-text("Types")');
    const typeNumberElement = typesSection.locator('..').locator('div.text-2xl');
    const diagnosticsTypeCount = parseInt(await typeNumberElement.textContent() || '0');
    
    expect(diagnosticsTypeCount).toBeGreaterThan(0);
    
    // Go to type chart and verify same count
    await page.goto('/types');
    await page.waitForSelector('text=Type Chart');
    
    const typeChartHeaderText = await page.locator('h1 + p').textContent();
    const chartMatch = typeChartHeaderText?.match(/(\d+)/);
    const chartTypeCount = chartMatch ? parseInt(chartMatch[1]) : 0;
    
    expect(chartTypeCount).toBe(diagnosticsTypeCount);
  });

  test('Type Chart grid should have correct dimensions', async ({ page }) => {
    await page.goto('/types');
    await page.waitForSelector('text=Type Chart');
    
    // Get the header text to verify count
    const headerText = await page.locator('h1 + p').textContent();
    const match = headerText?.match(/(\d+)/);
    const typeCount = match ? parseInt(match[1]) : 0;
    
    // Check that grid has correct number of columns (types + 1 for row headers)
    const gridHeaders = page.locator('div[class*="grid"] > div:first-child > div');
    const headerCount = await gridHeaders.count();
    
    // First column is labels, so headers should be typeCount + 1
    expect(headerCount).toBe(typeCount + 1);
  });

  test('Type filters should have same count as chart', async ({ page }) => {
    await page.goto('/types');
    await page.waitForSelector('text=Type Chart');
    
    const headerText = await page.locator('h1 + p').textContent();
    const match = headerText?.match(/(\d+)/);
    const chartTypeCount = match ? parseInt(match[1]) : 0;
    
    // Switch to list view to see filters
    await page.click('button:has-text("List")');
    await page.waitForTimeout(500);
    
    // Count type filter buttons (excluding "All")
    const typeButtons = page.locator('button[class*="px-3"][class*="py-1"]').filter({ hasNotText: 'All' });
    const filterCount = await typeButtons.count();
    
    expect(filterCount).toBe(chartTypeCount);
  });

  test('Pseudo types should not appear in chart', async ({ page }) => {
    await page.goto('/types');
    await page.waitForSelector('text=Type Chart');
    
    // Verify ??? type is not in the chart
    const questionType = page.locator('text=/^\\?\\?\\?$/');
    await expect(questionType).toHaveCount(0);
  });

  test('API /api/types should match diagnostics count', async ({ page, request }) => {
    // Get diagnostics count
    await page.goto('/diagnostics');
    await page.waitForSelector('text=Diagnostics');
    
    const typesSection = page.locator('div.text-gray-400:has-text("Types")');
    const typeNumberElement = typesSection.locator('..').locator('div.text-2xl');
    const diagnosticsTypeCount = parseInt(await typeNumberElement.textContent() || '0');
    
    // Get API count
    const response = await request.get('/api/types');
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    const apiTypeCount = data.types?.length || 0;
    
    expect(apiTypeCount).toBe(diagnosticsTypeCount);
  });
});
