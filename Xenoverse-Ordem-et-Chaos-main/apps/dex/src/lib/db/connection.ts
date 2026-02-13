
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = process.env.NODE_ENV === 'production'
    ? join(process.cwd(), 'dex.db')  // Vercel: copied to app root during build
    : join(process.cwd(), '../../out/dex.db');  // Local dev: original location

let db: Database.Database | null = null;

export function getDb() {
    if (!db) {
        try {
            db = new Database(DB_PATH, { readonly: true });
        } catch (error) {
            console.error('Failed to open database:', error);
            return null;
        }
    }
    return db;
}

export function isDatabaseAvailable(): boolean {
    return !!getDb();
}
