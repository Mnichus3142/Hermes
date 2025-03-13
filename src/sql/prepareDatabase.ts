import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import sql from '$lib/functions/db';
const readline = require('node:readline');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const prepareDatabase = async () => {
    verifyTables();
}

export const verifyConnection = async () => {
    try {
        await sql`SELECT 1;`;
        return true;
    } catch (error) {
        console.error('There was an error during connection verification', error);
        throw error;
    }
}

export const verifyTables = async () => {
    try {
        const files = await readdir(__dirname);
        
        const sqlFiles = files.filter(file => file.endsWith('.sql')).map(file => file.replace('.sql', ''));

        const query = await sql`SELECT table_name
                                    FROM information_schema.tables
                                    WHERE table_schema='public'
                                    AND table_type='BASE TABLE';`;

        const tables = query.map(table => table.table_name);
                    
        if (!sqlFiles.every(file => tables.includes(file))) return createTables(getNotExistingTables(sqlFiles, tables));

        return true;
    } catch (error) {
        console.error('There was an error during reading files in SQL catalog or when getting tables from database', error);
        throw error;
    }
}

const getNotExistingTables = (sqlFiles: String[], tables: String[]) => {
    return sqlFiles.filter(file => !tables.includes(file));
}

const standarizeQuery = (query: String) => {
    return query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

export const createTables = async (tables: String[]) => {
    for (const table of tables) {
        const query = standarizeQuery(fs.readFileSync(`${__dirname}/${table}.sql`, 'utf8'));
        try {
            await sql.unsafe(query);
        } catch (error) {
            console.error('There was an error during creating tables', error);
            throw error;
        }
    }

    return true;
}
