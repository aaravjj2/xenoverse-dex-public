const { chromium } = require('playwright');
const path = require('path');

// Utility function to wait with visual feedback
async function wait(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function recordFullDemo() {
  const browser = await chromium.launch({
    headless: true, // Run headless for WSL compatibility
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Enable video recording
  const context = await browser.newContext({
    recordVideo: {
      dir: path.join(__dirname, 'videos'),
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('🎬 Starting video recording...');
    
    // 1. HOME PAGE - Pokédex
    console.log('📍 Step 1: Navigating to home page...');
    await page.goto('http://localhost:3001');
    await wait(3000); // Let page load and show
    
    // Scroll down to show more species
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // 2. NAVIGATE TO SPECIES PAGE
    console.log('📍 Step 2: Navigating to Trishout species page...');
    await page.goto('http://localhost:3001/species/TRISHOUT');
    await wait(3000);
    
    // Show header section
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(2000);

    // 3. STATS TAB
    console.log('📍 Step 3: Viewing Stats tab with Lv.100 ranges...');
    await page.click('button:has-text("Stats")');
    await wait(2000);
    
    // Scroll to show the Lv.100 ranges
    await page.evaluate(() => window.scrollBy(0, 300));
    await wait(2500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // 4. DATA TAB
    console.log('📍 Step 4: Viewing Data tab...');
    await page.click('button:has-text("Data")');
    await wait(2000);

    // 5. LEARNSET TAB
    console.log('📍 Step 5: Viewing Learnset tab with methods...');
    await page.click('text=Learnset');
    await wait(2000);
    
    // Click through learnset methods
    const breedingTab = page.locator('button:has-text("By Breeding")');
    if (await breedingTab.count() > 0) {
      await breedingTab.click();
      await wait(2000);
    }
    
    const levelTab = page.locator('button:has-text("level")');
    if (await levelTab.count() > 0) {
      await levelTab.click();
      await wait(2000);
    }
    
    const tutorTab = page.locator('button:has-text("By Move Tutor")');
    if (await tutorTab.count() > 0) {
      await tutorTab.click();
      await wait(2000);
    }

    // Scroll to show more moves
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // 6. EVOLUTION TAB
    console.log('📍 Step 6: Viewing Evolution tab...');
    const evolutionTab = page.locator('text=Evolution');
    if (await evolutionTab.count() > 0) {
      await evolutionTab.click();
      await wait(2000);
    }

    // 7. FORMS TAB
    console.log('📍 Step 7: Viewing Forms tab with descriptions...');
    await page.click('text=Forms');
    await wait(2000);
    
    // Scroll to show form descriptions
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(3000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // 8. FORM SWITCHING - Terrestrial
    console.log('📍 Step 8: Switching to Terrestrial Form...');
    try {
      // Try clicking the Terrestrial button in the form tabs
      await page.click('button:has-text("Terrestrial")');
      await wait(3000);
    } catch (e) {
      console.log('   Form switching via button not available, navigating directly...');
      await page.goto('http://localhost:3001/species/TRISHOUT_1');
      await wait(3000);
    }
    
    // Show the new form's stats
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(2000);
    
    await page.click('button:has-text("Stats")');
    await wait(2500);

    // 9. FORM SWITCHING - Xenoversal
    console.log('📍 Step 9: Switching to Xenoversal Form...');
    try {
      await page.click('button:has-text("Xenoversal")');
      await wait(3000);
    } catch (e) {
      console.log('   Navigating to Xenoversal form directly...');
      await page.goto('http://localhost:3001/species/TRISHOUT_2');
      await wait(3000);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(2000);

    // 10. FORM SWITCHING - Astral
    console.log('📍 Step 10: Switching to Astral Form...');
    try {
      await page.click('button:has-text("Astral")');
      await wait(3000);
    } catch (e) {
      console.log('   Navigating to Astral form directly...');
      await page.goto('http://localhost:3001/species/TRISHOUT_3');
      await wait(3000);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(2000);

    // 11. TYPES PAGE
    console.log('📍 Step 11: Navigating to Types page...');
    await page.goto('http://localhost:3001/types');
    await wait(3000);
    
    // Scroll to show more of the type chart
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // Toggle to List view
    const listButton = page.locator('button:has-text("List")');
    if (await listButton.count() > 0) {
      await listButton.click();
      await wait(2500);
    }

    // 12. ABILITIES PAGE
    console.log('📍 Step 12: Navigating to Abilities page...');
    await page.goto('http://localhost:3001/abilities');
    await wait(3000);
    
    // Search for an ability
    await page.fill('input[placeholder*="Search"]', 'Amplify');
    await wait(2000);
    await page.fill('input[placeholder*="Search"]', '');
    await wait(1500);
    
    // Scroll to show more abilities
    await page.evaluate(() => window.scrollBy(0, 500));
    await wait(2500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // 13. MOVES PAGE
    console.log('📍 Step 13: Navigating to Moves page...');
    await page.goto('http://localhost:3001/moves');
    await wait(3000);
    
    // Interact with filters
    await page.fill('input[placeholder*="Name"]', 'Fire');
    await wait(2000);
    
    // Clear filter
    await page.click('text=Clear');
    await wait(1500);
    
    // Scroll to show more moves
    await page.evaluate(() => window.scrollBy(0, 600));
    await wait(2500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(1500);

    // 14. COMPARE PAGE
    console.log('📍 Step 14: Navigating to Compare page...');
    await page.goto('http://localhost:3001/compare');
    await wait(3000);
    
    // Type in first search box
    const search1 = page.locator('input').first();
    await search1.click();
    await search1.fill('Trishout');
    await wait(2000);
    
    // Type in second search box
    const search2 = page.locator('input').nth(1);
    await search2.click();
    await search2.fill('Pikachu');
    await wait(2000);

    // 15. BACK TO HOME
    console.log('📍 Step 15: Returning to home page...');
    await page.goto('http://localhost:3001');
    await wait(3000);
    
    // Final scroll to showcase
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2000);
    await page.evaluate(() => window.scrollBy(0, 400));
    await wait(2000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await wait(2000);

    console.log('✅ Demo recording complete!');
    
  } catch (error) {
    console.error('❌ Error during recording:', error);
  } finally {
    // Close and save video
    await page.close();
    await context.close();
    await browser.close();
    
    console.log('🎬 Video saved to test-evidence/videos/');
  }
}

// Run the demo
recordFullDemo().catch(console.error);
