// =========================================================================================
// This file contains the database client for connecting to MongoDB.
// =========================================================================================

// =========================================================================================
// Imports
// =========================================================================================

import { MongoClient, ServerApiVersion, Db } from "mongodb";
import logger from "../logger/logger";

// =========================================================================================
// Get environment variables for database connection.
// =========================================================================================

const uri = process.env.DATABASE_URL as string;
const databaseName = process.env.DATABASE_NAME;

// =========================================================================================
// Database object
// =========================================================================================

let db: Db;

// =========================================================================================
// Function to connect to the database and return the database object.
// =========================================================================================

export const connectToDatabase = async (): Promise<Db> => {
    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    try {
        await client.connect();
        logger.info("Successfully connected to MongoDB");
        db = client.db(databaseName);
        return db;
    } catch (error) {
        logger.error("Failed to connect to MongoDB", error);
        throw error;
    }
};
