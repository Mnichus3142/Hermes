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

logger.info("Setting up health check endpoint...");

app.get("/health", async (req, res) => {
    try {
        const healthStatus = await checkHealth();

        res.status(healthStatus.code).json({
            status: healthStatus.code === 200 ? "Healthy" : "Unhealthy",
        });
    } catch (error) {
        res.status(500).json({ error: "Health check failed" });
    }
});

logger.info("Health check endpoint is ready");

// =========================================================================================
// OAuth buttons endpoint
// =========================================================================================

import { getOAuthButtons } from "./OAUTH/oauth";

logger.info("Setting up OAuth buttons endpoint...");

app.get("/OAuth", async (req, res) => {
    try {
        const buttons = await getOAuthButtons();

        res.status(buttons.code).json({
            buttons: buttons.buttons,
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve OAuth buttons" });
    }
});

logger.info("OAuth buttons endpoint is ready");

// ========================================================================================
// Listen for incoming requests
// ========================================================================================

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
