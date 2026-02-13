
import { getDb } from './connection';

export interface AssetCoverageEntry {
    covered: number;      // Count of form_entries with ≥1 resolved asset
    percent: number;      // covered / formEntries * 100 (0-100)
    totalFiles: number;   // Total files for this asset type (can exceed formEntries)
}

export interface DiagnosticStats {
    speciesCount: number;
    baseSpeciesCount: number;    // form_id = 0
    formCount: number;           // form_id > 0
    devEntryCount: number;       // is_dev = 1
    movesCount: number;
    typesCount: number;
    abilitiesCount: number;
    evolutionsCount: number;
    learnsetsCount: number;
    speciesWithLearnset: number; // Count of species that have at least one learnset entry
    itemsCount: number;
    trainersCount: number;
    trainerPartyCount: number;
    worldFactsCount: number;
    assetCoverage: {
        formEntries: number;     // Denominator (base + forms = speciesCount)
        icon: AssetCoverageEntry;
        front: AssetCoverageEntry;
        frontShiny: AssetCoverageEntry;
        cry: AssetCoverageEntry;
    };
}

export function getDiagnostics(): DiagnosticStats | null {
    const db = getDb();
    if (!db) return null;

    try {
        const speciesCount = db.prepare('SELECT COUNT(*) as count FROM species').get() as { count: number };
        const baseSpeciesCount = db.prepare('SELECT COUNT(*) as count FROM species WHERE form_id = 0').get() as { count: number };
        const formCount = db.prepare('SELECT COUNT(*) as count FROM species WHERE form_id > 0').get() as { count: number };
        const devEntryCount = db.prepare('SELECT COUNT(*) as count FROM species WHERE is_dev = 1').get() as { count: number };
        const movesCount = db.prepare('SELECT COUNT(*) as count FROM moves').get() as { count: number };
        const typesCount = db.prepare('SELECT COUNT(*) as count FROM types WHERE is_pseudo_type = 0').get() as { count: number };
        const abilitiesCount = db.prepare('SELECT COUNT(*) as count FROM abilities').get() as { count: number };
        const evolutionsCount = db.prepare('SELECT COUNT(*) as count FROM evolutions').get() as { count: number };
        const learnsetsCount = db.prepare('SELECT COUNT(*) as count FROM learnsets').get() as { count: number };
        const speciesWithLearnset = db.prepare('SELECT COUNT(DISTINCT species_id) as count FROM learnsets').get() as { count: number };

        // New counts
        const itemsCount = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
        const trainersCount = db.prepare('SELECT COUNT(*) as count FROM trainers').get() as { count: number };
        const trainerPartyCount = db.prepare('SELECT COUNT(*) as count FROM trainer_party').get() as { count: number };
        const worldFactsCount = db.prepare('SELECT COUNT(*) as count FROM world_facts').get() as { count: number };

        // Assets coverage - formEntries is the denominator (all species including forms)
        const formEntries = speciesCount.count;

        // Count species with at least one asset of each type (covered entries)
        const iconCovered = db.prepare('SELECT COUNT(DISTINCT species_id) as count FROM assets WHERE icon_path IS NOT NULL').get() as { count: number };
        const frontCovered = db.prepare('SELECT COUNT(DISTINCT species_id) as count FROM assets WHERE front_path IS NOT NULL').get() as { count: number };
        const frontShinyCovered = db.prepare('SELECT COUNT(DISTINCT species_id) as count FROM assets WHERE front_shiny_path IS NOT NULL').get() as { count: number };
        const cryCovered = db.prepare('SELECT COUNT(DISTINCT species_id) as count FROM assets WHERE cry_path IS NOT NULL').get() as { count: number };

        // Count total files (can exceed formEntries if multiple files per species)
        const iconTotal = db.prepare('SELECT COUNT(*) as count FROM assets WHERE icon_path IS NOT NULL').get() as { count: number };
        const frontTotal = db.prepare('SELECT COUNT(*) as count FROM assets WHERE front_path IS NOT NULL').get() as { count: number };
        const frontShinyTotal = db.prepare('SELECT COUNT(*) as count FROM assets WHERE front_shiny_path IS NOT NULL').get() as { count: number };
        const cryTotal = db.prepare('SELECT COUNT(*) as count FROM assets WHERE cry_path IS NOT NULL').get() as { count: number };

        // Helper to calculate percentage (clamped 0-100)
        const calcPercent = (covered: number, total: number): number => {
            if (total === 0) return 0;
            return Math.min(100, Math.round((covered / total) * 100));
        };

        return {
            speciesCount: speciesCount.count,
            baseSpeciesCount: baseSpeciesCount.count,
            formCount: formCount.count,
            devEntryCount: devEntryCount.count,
            movesCount: movesCount.count,
            typesCount: typesCount.count,
            abilitiesCount: abilitiesCount.count,
            evolutionsCount: evolutionsCount.count,
            learnsetsCount: learnsetsCount.count,
            speciesWithLearnset: speciesWithLearnset.count,
            itemsCount: itemsCount.count,
            trainersCount: trainersCount.count,
            trainerPartyCount: trainerPartyCount.count,
            worldFactsCount: worldFactsCount.count,
            assetCoverage: {
                formEntries,
                icon: {
                    covered: iconCovered.count,
                    percent: calcPercent(iconCovered.count, formEntries),
                    totalFiles: iconTotal.count,
                },
                front: {
                    covered: frontCovered.count,
                    percent: calcPercent(frontCovered.count, formEntries),
                    totalFiles: frontTotal.count,
                },
                frontShiny: {
                    covered: frontShinyCovered.count,
                    percent: calcPercent(frontShinyCovered.count, formEntries),
                    totalFiles: frontShinyTotal.count,
                },
                cry: {
                    covered: cryCovered.count,
                    percent: calcPercent(cryCovered.count, formEntries),
                    totalFiles: cryTotal.count,
                },
            }
        };
    } catch (error) {
        console.error('Query error:', error);
        return null;
    }
}

