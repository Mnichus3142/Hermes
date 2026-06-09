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

const uri = process.env.DATABASE_URL;
const databaseName = process.env.DATABASE_NAME;

if (!uri) {
    throw new Error("DATABASE_URL is not set");
}
if (!databaseName) {
    throw new Error("DATABASE_NAME is not set");
}

// =========================================================================================
// Database object
// =========================================================================================

let db: Db;
let client: MongoClient | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

// =========================================================================================
// Function to connect to the database and return the database object.
// =========================================================================================

export const connectToDatabase = async (): Promise<Db> => {
    if (db) {
        return db;
    }

    if (!client) {
        client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
            maxPoolSize: 20,
            minPoolSize: 2,
        });
    }

    try {
        if (!connectionPromise) {
            connectionPromise = client.connect();
        }

        await connectionPromise;
        logger.info("Successfully connected to MongoDB (shared client)");
        db = client.db(databaseName);
        return db;
    } catch (error) {
        connectionPromise = null;
        client = null;
        logger.error("Failed to connect to MongoDB", error);
        throw error;
    }
};
