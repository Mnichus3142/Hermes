import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import sql from '$lib/functions/db';
import 'erronaut';

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

        const queryTableNames = await sql`SELECT table_name
                                            FROM information_schema.tables
                                            WHERE table_schema='public'
                                            AND table_type='BASE TABLE';`;

        const tables = queryTableNames.map(table => table.table_name);
                    
        if (!sqlFiles.every(file => tables.includes(file))) createTables(getNotExistingTables(sqlFiles, tables));

        for (const table of tables) {
            const queryTableColumns = await sql`SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
                                              FROM information_schema.columns
                                              WHERE table_name = ${table};`;

            const file = fs.readFileSync(`${__dirname}/${table}.sql`, 'utf8')
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== '' && !line.startsWith('CREATE TABLE') && line !== ');')
            .reduce((acc, line) => {
                const [key, ...rest] = line.split(' ');
                acc[key] = rest.join(' ').replace(',', '');
                return acc;
            }, {} as Record<string, string>);

            let columnsInDatabase: { [key: string]: any } = {};

            for (const column of queryTableColumns) {
                const conditions = {
                    column_name: column.column_name,
                    data_type: column.data_type,
                    is_nullable: column.is_nullable,
                    column_default: column.column_default,
                    character_maximum_length: column.character_maximum_length
                }

                columnsInDatabase[column.column_name] = conditions;
            }

            for (const column in file) {
                if (column in columnsInDatabase) {
                    for (const word of file[column].split(' ')) {
                        if (word === 'SERIAL' && (columnsInDatabase[column].data_type !== 'integer' || columnsInDatabase[column].column_default !== 'nextval(\'${table}_${column}_seq\'::regclass)'))
                        {
                            const query = `ALTER TABLE ${table} DROP COLUMN ${column}; ALTER TABLE ${table} ADD COLUMN ${column} SERIAL PRIMARY KEY;`;
                            await sql.unsafe(query);
                        }

                        else if (word === 'VARCHAR(255)' && (column === 'password' || column === 'username') && (columnsInDatabase[column].character_maximum_length !== 255 || columnsInDatabase[column].data_type !== 'character varying' || columnsInDatabase[column].is_nullable !== 'NO'))
                        {
                            const query = `ALTER TABLE ${table} ALTER COLUMN ${column} SET NOT NULL; ALTER TABLE ${table} ALTER COLUMN ${column} SET DATA TYPE VARCHAR(255);`;
                            await sql.unsafe(query);
                        }
                    }
                }
                
                else {
                    const query = `ALTER TABLE ${table} ADD COLUMN ${column} ${file[column]}`;
                    await sql.unsafe(query);
                }
            }
        }
        return true;
    } catch (error) {
        console.error('There was an error during reading files in SQL catalog or when getting tables from database', error);
        throw error;
    }
}

const getNotExistingTables = (sqlFiles: String[], tables: String[]) => {
    return sqlFiles.filter(file => !tables.includes(file));
}

const standardizeQuery = (query: String) => {
    return query.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

export const createTables = async (tables: String[]) => {
    for (const table of tables) {
        const query = standardizeQuery(fs.readFileSync(`${__dirname}/${table}.sql`, 'utf8'));
        try {
            await sql.unsafe(query);
        } catch (error) {
            console.error('There was an error during creating tables', error);
            throw error;
        }
    }

    return true;
}
