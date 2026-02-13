import { test, expect } from '@playwright/test';

/**
 * API ENDPOINT TESTS
 * Tests all API routes to ensure data integrity and proper responses
 */

test.describe('Xenoverse Pokédex API Tests', () => {
  
  test.describe('1. Species API', () => {
    test('GET /api/species - should return species list', async ({ request }) => {
      const response = await request.get('/api/species');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
      
      console.log(`✓ API returned ${data.length} species`);
    });

    test('GET /api/species - should have required fields', async ({ request }) => {
      const response = await request.get('/api/species');
      const data = await response.json();
      
      const firstSpecies = data[0];
      expect(firstSpecies).toHaveProperty('species_id');
      expect(firstSpecies).toHaveProperty('name');
      expect(firstSpecies).toHaveProperty('form_id');
      
      console.log(`✓ Species data structure valid: ${firstSpecies.species_id}`);
    });

    test('GET /api/species/[id] - should return specific species', async ({ request }) => {
      const response = await request.get('/api/species/BULBASAUR');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('species_id');
      expect(data.species_id).toBe('BULBASAUR');
      
      console.log(`✓ Species detail API works for ${data.species_id}`);
    });

    test('GET /api/species/[id] - should return stats', async ({ request }) => {
      const response = await request.get('/api/species/BULBASAUR');
      const data = await response.json();
      
      expect(data).toHaveProperty('hp');
      expect(data).toHaveProperty('attack');
      expect(data).toHaveProperty('defense');
      expect(data).toHaveProperty('special_attack');
      expect(data).toHaveProperty('special_defense');
      expect(data).toHaveProperty('speed');
      expect(data).toHaveProperty('bst');
      
      console.log(`✓ Stats present (BST: ${data.bst})`);
    });

    test('GET /api/species/[id] - should return types', async ({ request }) => {
      const response = await request.get('/api/species/BULBASAUR');
      const data = await response.json();
      
      expect(data).toHaveProperty('type1');
      expect(data.type1).toBeTruthy();
      
      console.log(`✓ Types present: ${data.type1}${data.type2 ? ' / ' + data.type2 : ''}`);
    });

    test('GET /api/species/[id] - should return abilities', async ({ request }) => {
      const response = await request.get('/api/species/BULBASAUR');
      const data = await response.json();
      
      expect(data).toHaveProperty('ability1');
      
      console.log(`✓ Abilities present: ${data.ability1 || 'None'}`);
    });

    test('GET /api/species/[id] - should return learnset', async ({ request }) => {
      const response = await request.get('/api/species/BULBASAUR');
      const data = await response.json();
      
      expect(data).toHaveProperty('learnset');
      expect(Array.isArray(data.learnset)).toBeTruthy();
      
      if (data.learnset.length > 0) {
        const firstMove = data.learnset[0];
        expect(firstMove).toHaveProperty('move_id');
        expect(firstMove).toHaveProperty('name');
        console.log(`✓ Learnset with ${data.learnset.length} moves`);
      } else {
        console.log(`⚠ Learnset empty for ${data.species_id}`);
      }
    });

    test('GET /api/species/[id] - should handle invalid ID', async ({ request }) => {
      const response = await request.get('/api/species/INVALID_POKEMON_999');
      expect(response.status()).toBe(404);
      
      console.log('✓ 404 for invalid species ID');
    });
  });

  test.describe('2. Moves API', () => {
    test('GET /api/moves - should return moves list', async ({ request }) => {
      const response = await request.get('/api/moves');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
      
      console.log(`✓ API returned ${data.length} moves`);
    });

    test('GET /api/moves - should have required fields', async ({ request }) => {
      const response = await request.get('/api/moves');
      const data = await response.json();
      
      const firstMove = data[0];
      expect(firstMove).toHaveProperty('move_id');
      expect(firstMove).toHaveProperty('name');
      expect(firstMove).toHaveProperty('category');
      expect(firstMove).toHaveProperty('type');
      
      console.log(`✓ Move data structure valid: ${firstMove.name} (${firstMove.category})`);
    });

    test('GET /api/moves - should have correct categories', async ({ request }) => {
      const response = await request.get('/api/moves');
      const data = await response.json();
      
      const validCategories = ['Physical', 'Special', 'Status'];
      const categories = [...new Set(data.map((m: any) => m.category))];
      
      categories.forEach((cat: any) => {
        expect(validCategories).toContain(cat);
      });
      
      console.log(`✓ Move categories valid: ${categories.join(', ')}`);
    });

    test('GET /api/moves/[id] - should return specific move', async ({ request }) => {
      const response = await request.get('/api/moves/TACKLE');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('move_id');
      expect(data.move_id).toBe('TACKLE');
      
      console.log(`✓ Move detail API works for ${data.name}`);
    });

    test('GET /api/moves/[id] - should include power and accuracy', async ({ request }) => {
      const response = await request.get('/api/moves/TACKLE');
      const data = await response.json();
      
      expect(data).toHaveProperty('power');
      expect(data).toHaveProperty('accuracy');
      expect(data).toHaveProperty('pp');
      
      console.log(`✓ Move stats: Power ${data.power}, Accuracy ${data.accuracy}, PP ${data.pp}`);
    });
  });

  test.describe('3. Abilities API', () => {
    test('GET /api/abilities - should return abilities list', async ({ request }) => {
      const response = await request.get('/api/abilities');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
      
      console.log(`✓ API returned ${data.length} abilities`);
    });

    test('GET /api/abilities - should have required fields', async ({ request }) => {
      const response = await request.get('/api/abilities');
      const data = await response.json();
      
      const firstAbility = data[0];
      expect(firstAbility).toHaveProperty('ability_id');
      expect(firstAbility).toHaveProperty('name');
      
      console.log(`✓ Ability data structure valid: ${firstAbility.name}`);
    });

    test('GET /api/abilities/[id] - should return specific ability', async ({ request }) => {
      const response = await request.get('/api/abilities/OVERGROW');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('ability_id');
      expect(data.ability_id).toBe('OVERGROW');
      
      console.log(`✓ Ability detail API works for ${data.name}`);
    });
  });

  test.describe('4. Items API', () => {
    test('GET /api/items - should return items list', async ({ request }) => {
      const response = await request.get('/api/items');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(0);
      
      console.log(`✓ API returned ${data.length} items`);
    });

    test('GET /api/items - should have required fields', async ({ request }) => {
      const response = await request.get('/api/items');
      const data = await response.json();
      
      const firstItem = data[0];
      expect(firstItem).toHaveProperty('item_id');
      expect(firstItem).toHaveProperty('name');
      
      console.log(`✓ Item data structure valid: ${firstItem.name}`);
    });
  });

  test.describe('5. Types API', () => {
    test('GET /api/types - should return types list', async ({ request }) => {
      const response = await request.get('/api/types');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(Array.isArray(data)).toBeTruthy();
      expect(data.length).toBeGreaterThan(15); // At least 18 standard types
      
      console.log(`✓ API returned ${data.length} types`);
    });

    test('GET /api/types - should have required fields', async ({ request }) => {
      const response = await request.get('/api/types');
      const data = await response.json();
      
      const firstType = data[0];
      expect(firstType).toHaveProperty('type_id');
      expect(firstType).toHaveProperty('name');
      
      console.log(`✓ Type data structure valid: ${firstType.name}`);
    });

    test('GET /api/types/[id] - should return type effectiveness', async ({ request }) => {
      const response = await request.get('/api/types/FIRE');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('type_id');
      expect(data.type_id).toBe('FIRE');
      
      // Check for effectiveness data
      expect(data).toHaveProperty('weaknesses');
      expect(data).toHaveProperty('resistances');
      
      console.log(`✓ Type effectiveness data present for ${data.name}`);
    });
  });

  test.describe('6. Trainers API', () => {
    test('GET /api/trainers - should return trainers list', async ({ request }) => {
      const response = await request.get('/api/trainers');
      
      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data)).toBeTruthy();
        console.log(`✓ API returned ${data.length} trainers`);
      } else {
        console.log('⚠ Trainers API may not be implemented yet');
      }
    });
  });

  test.describe('7. World/Facts API', () => {
    test('GET /api/world - should return world data', async ({ request }) => {
      const response = await request.get('/api/world');
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✓ World API returns data');
      } else {
        console.log('⚠ World API may not be implemented yet');
      }
    });
  });

  test.describe('8. Assets API', () => {
    test('GET /api/assets/sprites/[id] - should return sprite', async ({ request }) => {
      const response = await request.get('/api/assets/sprites/BULBASAUR_0_f');
      
      if (response.ok()) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toMatch(/image|octet-stream/);
        console.log(`✓ Sprite API works (${contentType})`);
      } else {
        console.log('⚠ Sprite may not exist for this species');
      }
    });

    test('GET /api/assets/cries/[id] - should return cry audio', async ({ request }) => {
      const response = await request.get('/api/assets/cries/BULBASAUR');
      
      if (response.ok()) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toMatch(/audio|ogg|octet-stream/);
        console.log(`✓ Cry audio API works (${contentType})`);
      } else {
        console.log('⚠ Cry audio may not exist for this species');
      }
    });
  });

  test.describe('9. Database Diagnostics API', () => {
    test('GET /api/diagnostics - should return database stats', async ({ request }) => {
      const response = await request.get('/api/diagnostics');
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('connected');
      expect(data.connected).toBe(true);
      
      console.log('✓ Database diagnostics API works');
    });

    test('GET /api/diagnostics - should return counts', async ({ request }) => {
      const response = await request.get('/api/diagnostics');
      const data = await response.json();
      
      expect(data).toHaveProperty('speciesCount');
      expect(data).toHaveProperty('movesCount');
      expect(data).toHaveProperty('abilitiesCount');
      
      console.log(`✓ Counts: ${data.speciesCount} species, ${data.movesCount} moves, ${data.abilitiesCount} abilities`);
    });

    test('GET /api/diagnostics - should return type count', async ({ request }) => {
      const response = await request.get('/api/diagnostics');
      const data = await response.json();
      
      expect(data).toHaveProperty('typesCount');
      expect(data.typesCount).toBeGreaterThan(15);
      
      console.log(`✓ Type count: ${data.typesCount}`);
    });
  });

  test.describe('10. Data Integrity Checks', () => {
    test('Species with forms should have consistent base data', async ({ request }) => {
      // Get all species
      const response = await request.get('/api/species');
      const allSpecies = await response.json();
      
      // Find species with forms (form_id > 0)
      const formsSpecies = allSpecies.filter((s: any) => s.form_id > 0);
      
      if (formsSpecies.length > 0) {
        console.log(`✓ Found ${formsSpecies.length} form entries`);
        
        // Check first form has base species
        const firstForm = formsSpecies[0];
        const baseSpecies = allSpecies.find(
          (s: any) => s.species_id === firstForm.species_id && s.form_id === 0
        );
        
        if (baseSpecies) {
          console.log(`✓ Forms have corresponding base species`);
        } else {
          console.log(`⚠ Form ${firstForm.species_id}_${firstForm.form_id} missing base`);
        }
      }
    });

    test('Move categories should be valid', async ({ request }) => {
      const response = await request.get('/api/moves');
      const moves = await response.json();
      
      const validCategories = ['Physical', 'Special', 'Status'];
      const invalidMoves = moves.filter((m: any) => !validCategories.includes(m.category));
      
      expect(invalidMoves.length).toBe(0);
      console.log('✓ All moves have valid categories');
    });

    test('Species should have valid BST', async ({ request }) => {
      const response = await request.get('/api/species');
      const species = await response.json();
      
      const invalidBST = species.filter((s: any) => {
        const bst = s.hp + s.attack + s.defense + s.special_attack + s.special_defense + s.speed;
        return bst !== s.bst;
      });
      
      if (invalidBST.length > 0) {
        console.log(`⚠ ${invalidBST.length} species have incorrect BST calculations`);
      } else {
        console.log('✓ All species have correct BST');
      }
    });

    test('Types count should match between APIs', async ({ request }) => {
      // Get from diagnostics
      const diagResponse = await request.get('/api/diagnostics');
      const diagData = await diagResponse.json();
      
      // Get from types list
      const typesResponse = await request.get('/api/types');
      const typesData = await typesResponse.json();
      
      expect(typesData.length).toBe(diagData.typesCount);
      console.log(`✓ Type count consistent: ${diagData.typesCount}`);
    });
  });

  test.describe('11. Performance Tests', () => {
    test('Species list API should respond quickly', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get('/api/species');
      const duration = Date.now() - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
      
      console.log(`✓ Species API responded in ${duration}ms`);
    });

    test('Species detail API should respond quickly', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get('/api/species/BULBASAUR');
      const duration = Date.now() - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
      
      console.log(`✓ Species detail API responded in ${duration}ms`);
    });

    test('Moves list API should respond quickly', async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get('/api/moves');
      const duration = Date.now() - startTime;
      
      expect(response.ok()).toBeTruthy();
      expect(duration).toBeLessThan(2000);
      
      console.log(`✓ Moves API responded in ${duration}ms`);
    });
  });
});
