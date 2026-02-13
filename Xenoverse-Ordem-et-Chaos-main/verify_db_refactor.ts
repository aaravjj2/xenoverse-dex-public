
import { getSpeciesList, getDb } from './apps/dex/src/lib/db/index'; // Import directly from new structure

const db = getDb();
if (db) {
    console.log('DB Connection: Success');
    const species = getSpeciesList({ limit: 1 });
    console.log('Fetching Species:', species.length > 0 ? species[0].name : 'No species found');
} else {
    console.log('DB Connection: Failed');
}
