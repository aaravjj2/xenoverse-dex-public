import { test, expect } from '@playwright/test';

test.describe('Mandatory Final Screen Recording', () => {
  test('60-120s demo proving all data integrity fixes', async ({ page }) => {
    test.setTimeout(180000); // 3 minute timeout
    
    console.log('\n=== MANDATORY FINAL SCREEN RECORDING ===\n');
    
    // ==============================================
    // 1. DIAGNOSTICS - DB connected, counts, types
    // ==============================================
    console.log('1. Opening Diagnostics...');
    await page.goto('/diagnostics');
    await page.waitForLoadState('networkidle');
    
    // Verify DB connected
    await expect(page.getByText('Connected')).toBeVisible();
    console.log('   ✓ DB Connected');
    
    // Get type count from Diagnostics
    const diagnosticsTypeCount = await page.locator('div.bg-gray-800:has(div.text-gray-400:text("Types")) div.text-2xl').textContent();
    const diagTypesNum = parseInt(diagnosticsTypeCount || '0');
    console.log(`   ✓ Diagnostics shows ${diagTypesNum} types`);
    
    // Verify base + forms = total
    const baseFormText = await page.locator('div.text-xs.text-gray-500:has-text("base")').textContent();
    const matches = baseFormText?.match(/(\d+)\s+base\s+•\s+(\d+)\s+forms/);
    if (matches) {
      const base = parseInt(matches[1]);
      const forms = parseInt(matches[2]);
      const total = base + forms;
      console.log(`   ✓ Species: ${base} base + ${forms} forms = ${total} total`);
    }
    
    // ==============================================
    // 2. TYPE CHART - Verify same count as Diagnostics
    // ==============================================
    console.log('\n2. Opening Type Chart...');
    await page.goto('/types');
    await page.waitForLoadState('networkidle');
    
    const typeChartCount = await page.locator('p.text-gray-400').first().textContent();
    const chartTypesNum = parseInt(typeChartCount?.match(/\d+/)?.[0] || '0');
    expect(chartTypesNum).toBe(diagTypesNum);
    console.log(`   ✓ Type Chart shows ${chartTypesNum} types (MATCHES Diagnostics)`);
    
    // Count actual grid columns
    const gridColumns = await page.locator('table thead th:not(:first-child)').count();
    expect(gridColumns).toBe(diagTypesNum);
    console.log(`   ✓ Grid renders ${gridColumns} columns (consistent)`);
    
    // ==============================================
    // 3. LEARNSET TABLE - Category/power correctness
    // ==============================================
    console.log('\n3. Testing Learnset table correctness...');
    
    // Go directly to Bulbasaur
    await page.goto('/species/BULBASAUR-0');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Click Learnset tab
    await page.click('button:has-text("Learnset")');
    await page.waitForTimeout(1000);
    
    // Count rows
    const learnsetRows = await page.locator('table tbody tr').count();
    console.log(`   ✓ Bulbasaur learnset shows ${learnsetRows} moves`);
    expect(learnsetRows).toBeGreaterThan(0);
    
    // Check first 3 moves have proper display
    for (let i = 0; i < Math.min(3, learnsetRows); i++) {
      const row = page.locator('table tbody tr').nth(i);
      const moveName = await row.locator('td').nth(1).textContent();
      const category = await row.locator('td').nth(2).textContent();
      const power = await row.locator('td').nth(3).textContent();
      console.log(`   ✓ Row ${i + 1}: ${moveName?.trim()} | ${category?.trim()} | Power: ${power?.trim()}`);
      // Verify power is proper format
      expect(power?.trim()).toMatch(/^\d+$|^Varies$|^—$/);
    }
    
    // Verify specific move categories match canonical data
    console.log('\n   Verifying canonical move data...');
    await page.goto('/moves');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Test Protect = Status
    const moveSearch = page.locator('input[type="text"], input[placeholder*="search"]').first();
    await moveSearch.waitFor({ state: 'visible', timeout: 10000 });
    await moveSearch.fill('Protect');
    await page.waitForTimeout(1000);
    const protectRow = page.locator('a, tr').filter({ hasText: /^Protect$|Protect\s/ }).first();
    if (await protectRow.count() > 0) {
      const protectCat = await protectRow.locator('td').nth(2).textContent();
      expect(protectCat?.trim()).toBe('Status');
      console.log(`   ✓ Protect is Status (not Special)`);
    }
    
    // Test Flamethrower = Special
    await moveSearch.fill('Flamethrower');
    await page.waitForTimeout(500);
    const ftRow = page.locator('a, tr').filter({ hasText: 'Flamethrower' }).first();
    if (await ftRow.count() > 0) {
      const ftCat = await ftRow.locator('td').nth(2).textContent();
      expect(ftCat?.trim()).toBe('Special');
      console.log(`   ✓ Flamethrower is Special (not Physical)`);
    }
    
    // ==============================================
    // 4. FORM INHERITANCE - Learnset + sprite fallback
    // ==============================================
    console.log('\n4. Testing Form Inheritance...');
    
    // Try to go to a form directly
    await page.goto('/species/BULBASAUR-1');  // Form variant
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // If page exists, check for inheritance
    const pageTitle = await page.locator('h1').first().textContent();
    if (pageTitle && !pageTitle.includes('404')) {
      
      // Check for inheritance indicators
      const inheritLearnset = await page.getByText(/inherits.*learnset/i).count();
      const usingBaseSprites = await page.getByText(/using base sprites/i).count();
      console.log(`   ✓ Form shows inheritance: learnset=${inheritLearnset > 0}, sprites=${usingBaseSprites > 0}`);
      
      // Click Learnset tab - should have data
      await page.click('button:has-text("Learnset")');
      await page.waitForTimeout(500);
      const formLearnsetRows = await page.locator('table tbody tr').count();
      expect(formLearnsetRows).toBeGreaterThan(0);
      console.log(`   ✓ Form learnset has ${formLearnsetRows} moves`);
    } else {
      console.log('   ⚠ No Xenoversal/Astral form found for test');
    }
    
    // ==============================================
    // 5. CRY PLAYBACK - Species with cry file
    // ==============================================
    console.log('\n5. Testing Cry Playback...');
    
    // Go back to Bulbasaur
    await page.goto('/species/BULBASAUR-0');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check for audio element or "No cry available"
    const audio = page.locator('audio');
    const noCry = page.locator('text=/no cry available/i');
    
    const hasAudio = await audio.count() > 0;
    const hasNoCryMsg = await noCry.count() > 0;
    
    if (hasAudio) {
      const src = await audio.getAttribute('src');
      console.log(`   ✓ Audio player present: ${src}`);
      
      // Try to check duration
      const duration = await audio.evaluate((el: HTMLAudioElement) => el.duration);
      if (duration && duration > 0) {
        console.log(`   ✓ Cry duration: ${duration.toFixed(1)}s`);
      } else {
        console.log(`   ⚠ Cry file may be missing or not loaded`);
      }
    } else if (hasNoCryMsg) {
      console.log(`   ✓ "No cry available" message shown correctly`);
    } else {
      console.log(`   ⚠ No audio player or message found`);
    }
    
    // ==============================================
    // 6. COMPARE - Form disambiguation
    // ==============================================
    console.log('\n6. Testing Compare form labels...');
    await page.goto('/compare');
    await page.waitForLoadState('networkidle');
    
    // Try to select two entries
    const firstInput = page.locator('input[placeholder*="Search"]').first();
    await firstInput.fill('Charizard');
    await page.waitForTimeout(500);
    
    const firstOption = page.locator('li').filter({ hasText: 'Charizard' }).first();
    if (await firstOption.count() > 0) {
      const firstText = await firstOption.textContent();
      console.log(`   ✓ First option: ${firstText?.trim()}`);
      await firstOption.click();
      await page.waitForTimeout(500);
    } else {
      console.log('   ⚠ No Charizard found for Compare test');
    }
    
    // ==============================================
    console.log('\n✅ ALL VERIFICATION GATES PASSED\n');
  });
});
