import "dotenv/config";
import express from "express";
import logger from "./logger/logger";
import { connectToDatabase } from "./db/client";

const app = express();
const port = 8080;

// ========================================================================================
// Check if database connection is available
// ========================================================================================

logger.info("Checking database connection...");

const db = await connectToDatabase();

if (await db.command({ ping: 1 })) {
    logger.info("Database connection is healthy");
} else {
    logger.error("Database connection is not healthy");
    process.exit(1);
}

// ========================================================================================
// Start the server
// ========================================================================================

// ========================================================================================
// Define routes
// ========================================================================================

// =========================================================================================
// Health check endpoint
// ========================================================================================

import { checkHealth } from "./health/health";

app.get("/health", async (req, res) => {
    try {
        const healthStatus = await checkHealth();

        res.status(200).json({
            status: healthStatus,
        });
    } catch (error) {
        res.status(500).json({ error: "Health check failed" });
    }
});

// ========================================================================================
// Listen for incoming requests
// ========================================================================================

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
