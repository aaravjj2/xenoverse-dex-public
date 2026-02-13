import { describe, it, expect } from 'vitest';

// Simulating the extractTrainerInfo logic for testing
function extractTrainerInfo(script: string) {
    const trainers: any[] = [];

    // Pattern 1: :TYPE, "Name"
    const pattern1 = /:([A-Z_]+),\s*["']([^"']+)["']/g;
    let match;
    while ((match = pattern1.exec(script)) !== null) {
        trainers.push({
            trainerType: match[1],
            trainerName: match[2],
            confidence: 'high'
        });
    }

    // Pattern 2: PBTrainers::TYPE, "Name"
    const pattern2 = /PBTrainers::([A-Z_]+),\s*["']([^"']+)["']/g;
    while ((match = pattern2.exec(script)) !== null) {
        const exists = trainers.some(t => t.trainerType === match[1] && t.trainerName === match[2]);
        if (!exists) {
            trainers.push({
                trainerType: match[1],
                trainerName: match[2],
                confidence: 'high'
            });
        }
    }

    if (script.includes('TrainerBattle') || script.includes('pbTrainer')) {
        const allTrainerRefs = script.matchAll(/(?::|PBTrainers::)([A-Z_]+),\s*["']([^"']+)["']/g);
        for (const m of allTrainerRefs) {
            const exists = trainers.some(t => t.trainerType === m[1] && t.trainerName === m[2]);
            if (!exists) {
                trainers.push({
                    trainerType: m[1],
                    trainerName: m[2],
                    confidence: 'high'
                });
            }
        }
    }

    return trainers.length > 0 ? trainers : null;
}

describe('Trainer Extraction Patterns', () => {
    it('should extract single battle with :SYMBOL', () => {
        const script = 'TrainerBattle.start(:YOUNGSTER, "Mark")';
        const trainers = extractTrainerInfo(script);
        expect(trainers).toHaveLength(1);
        expect(trainers![0]).toMatchObject({
            trainerType: 'YOUNGSTER',
            trainerName: 'Mark'
        });
    });

    it('should extract battle with PBTrainers::TYPE', () => {
        const script = 'pbTrainerBattle(PBTrainers::TEAMDIMENSION, "Grunt")';
        const trainers = extractTrainerInfo(script);
        expect(trainers).toHaveLength(1);
        expect(trainers![0]).toMatchObject({
            trainerType: 'TEAMDIMENSION',
            trainerName: 'Grunt'
        });
    });

    it('should extract double battle with two trainers', () => {
        const script = 'pbDoubleTrainerBattle(PBTrainers::TEAMDIMENSION,"Num.063",0,_I ("Bzz..."),PBTrainers::TEAMDIMENSION,"Num.547",0)';
        const trainers = extractTrainerInfo(script);
        expect(trainers).toHaveLength(2);
        expect(trainers![0].trainerName).toBe('Num.063');
        expect(trainers![1].trainerName).toBe('Num.547');
    });

    it('should handle mixed patterns in one script', () => {
        const script = 'TrainerBattle.start(:LEADER, "Ginger") if pbTrainerBattle(PBTrainers::RIVAL, "Silver")';
        const trainers = extractTrainerInfo(script);
        expect(trainers).toHaveLength(2);
    });
});
