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
import cors from "cors";
import cookieParser from "cookie-parser";
import { validateAccessToken, validateRefreshToken } from "./user/user";

// ========================================================================================
// Config
// ========================================================================================

const app = express();
const port = 8080;

app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS,
        credentials: true,
    }),
);

app.use(express.json());
app.use(cookieParser());

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
// User
// ========================================================================================

// ========================================================================================
// User creation
// ========================================================================================

logger.info("Setting up user creation endpoint...");

import { User } from "./user/user";

app.get("/user", (req, res) => {
    const user = new User();
    user.checkAvailability(req.query.username as string).then((available) => {
        if (available) {
            res.status(200).json({ message: "Username is available" });
        } else {
            res.status(409).json({ message: "Username is already taken" });
        }
    });
});

app.post("/user", (req, res) => {
    const user = new User();

    user
        .create(req.body.username, req.body.password)
        .then(([success, errorMessage]) => {
            if (success) {
                res.status(201).json({ message: "User created successfully" });
            } else {
                res.status(409).json({ message: errorMessage });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        });
});

logger.info("User creation endpoint is ready");

// ========================================================================================
// User login / logout / refresh
// ========================================================================================

app.post("/auth", async (req, res) => {
    const user = new User();

    const [status, response] = await user.login(
        req.body.username,
        req.body.password,
    );

    if (!status) {
        return res.status(401).json({ message: response });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict" as const,
    } as const;

    res.cookie("accessToken", response.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", response.refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Login successful" });
});

// ========================================================================================
// Protected logout
// ========================================================================================

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
} as const;

app.post("/logout", validateAccessToken, async (req, res) => {
    const user = new User();
    const refreshToken = req.cookies.refreshToken;

    try {
        const [status, errorMessage] = await user.logout(refreshToken);

        if (status) {
            res.clearCookie("accessToken", COOKIE_OPTIONS);
            res.clearCookie("refreshToken", COOKIE_OPTIONS);
            return res.status(200).json({ message: "Logout successful" });
        } else {
            return res.status(500).json({ message: errorMessage });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// ========================================================================================
// Token refresh endpoint
// ========================================================================================

import { AuthTokens } from "./user/user";

app.post("/refresh", validateRefreshToken, async (req, res) => {
    const user = new User();
    const [status, response] = await user.refresh(req.cookies.refreshToken);

    if (!status) {
        return res.status(401).json({ message: response });
    }

    const tokens = response as AuthTokens;

    res.cookie("accessToken", tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Token refreshed successfully" });
});

// ========================================================================================
// Car management endpoints (CRUD operations)
// ========================================================================================

// ========================================================================================
// Get defined parameters for a car
// ========================================================================================

import {
    getDefinedParameters,
    createCar,
    Car,
    getCars,
    getCarById,
    updateCar,
    deleteCar,
} from "./car/car";

app.get("/car/parameters", validateAccessToken, async (req, res) => {
    try {
        const parameters = getDefinedParameters();
        res.status(200).json(parameters);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve car parameters" });
    }
});

app.post("/car", validateAccessToken, async (req, res) => {
    try {
        const car: Car = {
            ...req.body,
            ownerId: req.user!._id,
        };

        const [status, message] = await createCar(car);

        if (!status) {
            return res.status(400).json({ message });
        }

        return res.status(201).json({ message: "Car created successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to create car" });
    }
});

app.get("/car", validateAccessToken, async (req, res) => {
    try {
        const cars = await getCars(req.user!._id);
        res.status(200).json(cars);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve cars" });
    }
});

import { ObjectId } from "mongodb";

app.get("/car/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;

        const car = await getCarById(new ObjectId(id), req.user!._id);

        if (!car) {
            return res.status(404).json({ message: "Car not found" });
        }

        res.status(200).json(car);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve car" });
    }
});

app.patch("/car/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates: Partial<Car> = req.body;

        const [status, message] = await updateCar(new ObjectId(id), updates);

        if (!status) {
            return res.status(400).json({ message });
        }

        return res.status(200).json({ message: "Car updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update car" });
    }
});

app.delete("/car/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;

        const success = await deleteCar(new ObjectId(id));

        if (!success) {
            return res.status(404).json({ message: "Car not found" });
        }

        return res.status(200).json({ message: "Car deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete car" });
    }
});

// ========================================================================================
// Listen for incoming requests
// ========================================================================================

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
