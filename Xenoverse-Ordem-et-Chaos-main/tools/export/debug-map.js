
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { decode } from './marshal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');
const DATA_DIR = join(REPO_ROOT, 'Data');

function dumpMapCommands(mapId, eventIdTarget) {
    const filename = `Map${String(mapId).padStart(3, '0')}.rxdata`;
    const filepath = join(DATA_DIR, filename);

    console.log(`Dumping commands for ${filename}, Event ${eventIdTarget}...`);

    try {
        const buffer = readFileSync(filepath);
        const result = decode(buffer);
        const mapData = result.data;
        const events = mapData.events;

        const event = events[eventIdTarget];
        if (!event) {
            console.log(`Event ${eventIdTarget} not found.`);
            return;
        }

        for (const [pageIndex, page] of event.pages.entries()) {
            console.log(`--- Page ${pageIndex} ---`);
            if (!page.list) continue;

            for (const cmd of page.list) {
                // Ignore some noisy codes
                if ([101, 401, 0].includes(cmd.code)) continue; // Text, empty

                console.log(`Code ${cmd.code}, Params: ${JSON.stringify(cmd.parameters)}`);

                // If script, print it clearly
                if (cmd.code === 355 || cmd.code === 655) {
                    console.log(`  > Script: ${cmd.parameters[0]}`);
                }
            }
        }

    } catch (e) {
        console.error(e);
    }
}

const mapId = parseInt(process.argv[2]) || 8;
const eventId = parseInt(process.argv[3]) || 3;
dumpMapCommands(mapId, eventId);
