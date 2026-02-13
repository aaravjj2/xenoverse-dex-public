
import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../out/dex.db');

const db = new Database(DB_PATH);

const rows = db.prepare('SELECT DISTINCT trainer_type FROM trainers ORDER BY trainer_type').all();
console.log('All Trainer Types:');
rows.forEach(r => console.log(r.trainer_type));

const leaders = rows.filter(r => r.trainer_type.startsWith('LEADER_'));
console.log('\nGym Leaders found:', leaders.map(r => r.trainer_type));

const dimensions = rows.filter(r => r.trainer_type.includes('DIMENSION'));
console.log('\nDimension Trainers found:', dimensions.map(r => r.trainer_type));
