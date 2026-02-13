# Xenoverse Dex Proof Tour

This checklist ensures the final system meets all correctness and expansion requirements.

## 1. Diagnostics
- [ ] Asset Coverage is mathematically valid (fractions + percentages ≤ 100%).
- [ ] Counts are truthful and match other pages.
- [ ] "Pipeline Commands" / Export Files list MUST include:
    - `items.json`
    - `trainers.json`
    - `world_facts.json`

## 2. Items
- [ ] Header shows "All {total} items" initially.
- [ ] Search works and updates header: "Showing X of Y results for 'query'".
- [ ] Search "ball" (or similar) yields results.
- [ ] Empty search (no results) shows "No results for 'query'".
- [ ] **Critical**: Clearing search returns UI to "All {total} items". Never "0 of 0" if dataset not empty.

## 3. Trainers
- [ ] List page loads.
- [ ] Detail page loads with party sprites.

## 4. World
- [ ] Map / Facts load.
- [ ] Clicking a fact reveals "Provenance" panel (source file, confidence).

## 5. Validation
- [ ] Pipeline output or Diagnostics page confirms data export integrity.
- [ ] Diff (if available) shows verification changes.
