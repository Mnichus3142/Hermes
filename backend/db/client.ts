import { MongoClient, ServerApiVersion, Db } from "mongodb";
import logger from "../logger/logger";

const uri = process.env.DATABASE_URL as string;
const databaseName = process.env.DATABASE_NAME;

let db: Db;

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
