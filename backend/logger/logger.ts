// =========================================================================================
// This file contains the logger configuration using Winston for logging messages to both the console and a file.
// =========================================================================================

// =========================================================================================
// Imports
// =========================================================================================

import winston from "winston";

// =========================================================================================
// Logger configuration
// =========================================================================================

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        }),
        winston.format.colorize({ all: true }),
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: "app.log" }),
    ],
});

// =========================================================================================
// Export the logger for use in other parts of the application.
// =========================================================================================

export default logger;
