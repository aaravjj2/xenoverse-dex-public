
import { readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runDiff } from './diff.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const BUILDS_DIR = join(ROOT, 'out/builds');

function getLatestBuilds(limit = 2) {
    try {
        const builds = readdirSync(BUILDS_DIR).filter(file => {
            const filePath = join(BUILDS_DIR, file);
            return statSync(filePath).isDirectory() && (file.match(/^\d{8}-/) || file.match(/^\d{4}-\d{2}-\d{2}T/));
        }).sort().reverse(); // Sort descending (newest first)

        return builds.slice(0, limit);
    } catch (err) {
        console.error(`Error reading builds directory: ${err.message}`);
        return [];
    }
}

const latest = getLatestBuilds(2);

if (latest.length < 2) {
    console.error('Need at least 2 builds to generate a diff.');
    console.log(`Found: ${latest.join(', ')}`);
    process.exit(1);
}

const [toId, fromId] = latest; // reversed: newer, older

// runDiff expects (from, to)
runDiff(fromId, toId, BUILDS_DIR);
