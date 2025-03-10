import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const prepareDatabase = async () => {
    try {
        const files = await readdir(__dirname);
        
        const sqlFiles = files.filter(file => file.endsWith('.sql'));
        
        sqlFiles.forEach(file => {
            console.log(`- ${file}`);
        });

        console.log("Found SQL files:", sqlFiles);
        
        return sqlFiles;
    } catch (error) {
        console.error('There was an error during reading files in SQL catalog', error);
        throw error;
    }
}