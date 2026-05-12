// ========================================================================================
// Main entry point for the application
// ========================================================================================

// ========================================================================================
// Imports
// ========================================================================================

import "dotenv/config";
import express from "express";
import logger from "./logger/logger";
import { connectToDatabase } from "./db/client";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

// ========================================================================================
// Config
// ========================================================================================

const app = express();
const port = 8080;

// ========================================================================================
// Swagger setup
// ========================================================================================

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Hermes API Documentation",
            version: "1.0.0",
            description: "Hermes API - Endpoints documentation",
        },
        servers: [{ url: `http://localhost:${port}` }],
    },
    apis: ["./index.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

logger.info("Setting up health check endpoint...");

import { checkHealth } from "./health/health";

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check the health of the application
 *     responses:
 *       200:
 *         description: A healthy response indicating the application is running properly
 *       500:
 *         description: An error response indicating the health check failed
 */

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

logger.info("Setting up OAuth buttons endpoint...");

import { getOAuthButtons } from "./OAUTH/oauth";

(async () => {
    try {
        const buttons = await getOAuthButtons();
        buttons.buttons.forEach((button) => {
            button.status
                ? logger.info(`${button.name} OAuth is enabled`)
                : logger.warn(`${button.name} OAuth is disabled`);
        });
    } catch (error) {
        logger.error("Failed to retrieve OAuth buttons", error);
    }
})();

/**
 * @openapi
 * /OAuth:
 *   get:
 *     summary: Retrieve the status of OAuth buttons for various providers
 *     responses:
 *       200:
 *         description: A successful response containing the status of OAuth buttons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 buttons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The name of the OAuth provider (e.g., Google, GitHub)
 *                       status:
 *                         type: boolean
 *                         description: Indicates whether the OAuth button is enabled (true) or disabled (false)
 *       500:
 *         description: An error response indicating the retrieval of OAuth buttons failed
 */

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
// User management endpoints (registration, login, etc.)
// ========================================================================================

// ========================================================================================
// Listen for incoming requests
// ========================================================================================

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
    logger.info(
        `Swagger documentation available at http://localhost:${port}/api-docs`,
    );
});
