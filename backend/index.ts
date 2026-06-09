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
const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const corsOrigin = allowedOrigins.length
    ? allowedOrigins
    : ["http://localhost:5173", "http://127.0.0.1:5173"];

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const authRateLimitWindowMs = 60_000;
const authRateLimitMax = 20;
const authRateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = rateLimitStore.get(key);

    if (!current || now > current.resetAt) {
        rateLimitStore.set(key, {
            count: 1,
            resetAt: now + authRateLimitWindowMs,
        });
        return next();
    }

    if (current.count >= authRateLimitMax) {
        return res.status(429).json({ message: "Too many requests. Try again later." });
    }

    current.count += 1;
    rateLimitStore.set(key, current);
    return next();
};

app.use(
    cors({
        origin: corsOrigin,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

app.use(express.json({ limit: "100kb" }));
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
    const username =
        typeof req.query.username === "string" ? req.query.username.trim() : "";
    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const user = new User();
    user
        .checkAvailability(username)
        .then((available) => {
            if (available) {
                res.status(200).json({ message: "Username is available" });
            } else {
                res.status(409).json({ message: "Username is already taken" });
            }
        })
        .catch((error) => {
            logger.error("Failed to check username availability", error);
            res.status(500).json({ message: "Failed to check username availability" });
        });
});

app.post("/user", authRateLimit, (req, res) => {
    const user = new User();

    user
        .create(req.body.username, req.body.password)
        .then(([success, errorMessage]) => {
            if (success) {
                res.status(201).json({ 
                    success: true,
                    title: "Registration successful",
                    message: "You can now log in" 
                });
            } else {
                res.status(409).json({ 
                    success: false,
                    title: "Registration failed",
                    message: errorMessage 
                });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ 
                success: false,
                title: "Server error",
                message: "An error occurred during registration" 
            });
        });
});

logger.info("User creation endpoint is ready");

// ========================================================================================
// User login / logout / refresh
// ========================================================================================

app.post("/auth", authRateLimit, async (req, res) => {
    const user = new User();

    const [status, response] = await user.login(
        req.body.username,
        req.body.password,
    );

    if (!status) {
        return res.status(401).json({ 
            success: false,
            title: "Login failed",
            message: response 
        });
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

    return res.status(200).json({ 
        success: true,
        title: "Login successful",
        message: "Welcome back!" 
    });
});

// ========================================================================================
// Protected logout
// ========================================================================================

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
} as const;

app.post("/logout", async (req, res) => {
    const user = new User();
    const refreshToken = req.cookies.refreshToken;

    try {
        if (refreshToken) {
            await user.logout(refreshToken);
        }
    } catch (error) {
        console.error("Database token revocation failed:", error);
    }

    res.clearCookie("accessToken", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    
    return res.status(200).json({ message: "Logout successful" });
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

// ========================================================================================
// CRUD endpoints for cars
// ========================================================================================

app.post("/car", validateAccessToken, async (req, res) => {
    try {
        const car: Car = {
            ...sanitizeCarUpdates(req.body),
            ownerId: req.user!._id,
        } as Car;

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

const parseObjectId = (value: string): ObjectId | null => {
    if (!ObjectId.isValid(value) || !/^[a-fA-F0-9]{24}$/.test(value)) {
        return null;
    }

    return new ObjectId(value);
};

const sanitizeCarUpdates = (input: unknown): Partial<Car> => {
    if (!input || typeof input !== "object") {
        return {};
    }
    const source = input as Record<string, unknown>;
    const allowedTopLevel = [
        "make",
        "model",
        "year",
        "type",
        "mileage",
        "color",
        "vin",
        "registrationNumber",
        "engine",
        "transmission",
        "dates",
    ] as const;
    const sanitized = Object.fromEntries(
        Object.entries(source).filter(([key]) =>
            (allowedTopLevel as readonly string[]).includes(key),
        ),
    ) as Partial<Car>;

    if (sanitized.engine && typeof sanitized.engine === "object") {
        sanitized.engine = Object.fromEntries(
            Object.entries(sanitized.engine).filter(([key]) =>
                ["type", "displacement", "horsepower", "torque"].includes(key),
            ),
        ) as Car["engine"];
    }

    if (sanitized.transmission && typeof sanitized.transmission === "object") {
        sanitized.transmission = Object.fromEntries(
            Object.entries(sanitized.transmission).filter(([key]) =>
                ["type", "gears"].includes(key),
            ),
        ) as Car["transmission"];
    }

    if (sanitized.dates && typeof sanitized.dates === "object") {
        sanitized.dates = Object.fromEntries(
            Object.entries(sanitized.dates).filter(([key]) =>
                [
                    "manufactureDate",
                    "registrationDate",
                    "insuranceExpiryDate",
                    "technicalInspectionExpiryDate",
                ].includes(key),
            ),
        ) as Car["dates"];
    }

    return sanitized;
};

const sanitizeExpenseUpdates = (input: unknown): Record<string, unknown> => {
    if (!input || typeof input !== "object") {
        return {};
    }
    const source = input as Record<string, unknown>;
    const allowedTopLevel = [
        "amount",
        "date",
        "category",
        "description",
        "carId",
        "maintenanceWorks",
        "fuel",
        "mileageAtExpense",
    ];
    const sanitized = Object.fromEntries(
        Object.entries(source).filter(([key]) => allowedTopLevel.includes(key)),
    );

    if (sanitized.fuel && typeof sanitized.fuel === "object") {
        sanitized.fuel = Object.fromEntries(
            Object.entries(sanitized.fuel as Record<string, unknown>).filter(
                ([key]) => ["type", "volume", "pricePerUnit"].includes(key),
            ),
        );
    }

    if (Array.isArray(sanitized.maintenanceWorks)) {
        sanitized.maintenanceWorks = sanitized.maintenanceWorks.map((work) =>
            work && typeof work === "object"
                ? Object.fromEntries(
                      Object.entries(work).filter(([key]) =>
                          ["type", "description", "amount"].includes(key),
                      ),
                  )
                : work,
        );
    }

    return sanitized;
};

app.get("/car/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;
        const carId = parseObjectId(id);

        if (!carId) {
            return res.status(400).json({ message: "Invalid car id" });
        }

        const car = await getCarById(carId, req.user!._id);

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
        const updates: Partial<Car> = sanitizeCarUpdates(req.body);
        const carId = parseObjectId(id);

        if (!carId) {
            return res.status(400).json({ message: "Invalid car id" });
        }

        const [status, message] = await updateCar(carId, req.user!._id, updates);

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
        const carId = parseObjectId(id);

        if (!carId) {
            return res.status(400).json({ message: "Invalid car id" });
        }

        const success = await deleteCar(carId, req.user!._id);

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
// CURD for expenses
// ========================================================================================

import {
    updateExpense,
    createExpense,
    Expense,
    getExpenses,
    deleteExpense,
    getExpenseById,
    getFuelUsageByMonth,
    getSpendingByCar,
} from "./expenses/expenses";

app.get("/expense", validateAccessToken, async (req, res) => {
    try {
        const expenses = await getExpenses(req.user!._id);
        res.status(200).json(expenses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve expenses" });
    }
});

app.post("/expense", validateAccessToken, async (req, res) => {
    try {
        const expense = {
            ...sanitizeExpenseUpdates(req.body),
            ownerId: req.user!._id,
        } as Expense;

        const [status, message] = await createExpense(expense);

        if (!status) {
            return res.status(400).json({ message });
        }

        return res.status(201).json({ message: "Expense created successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create expense" });
    }
});

app.get("/expense/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;

        const expense = await getExpenseById(id, req.user!._id);

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.status(200).json(expense);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve expense" });
    }
});

app.patch("/expense/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = sanitizeExpenseUpdates(req.body);

        const [status, message] = await updateExpense(id, req.user!._id, updates);

        if (!status) {
            return res.status(400).json({ message });
        }

        return res.status(200).json({ message: "Expense updated successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update expense" });
    }
});

app.delete("/expense/:id", validateAccessToken, async (req, res) => {
    try {
        const { id } = req.params;

        const [status, message] = await deleteExpense(id, req.user!._id);

        if (!status) {
            return res.status(404).json({ message });
        }

        return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to delete expense" });
    }
});

const parseOptionalDate = (value: unknown): Date | undefined => {
    if (typeof value !== "string") {
        return undefined;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

app.get("/dashboard/fuel-by-month", validateAccessToken, async (req, res) => {
    try {
        const from = parseOptionalDate(req.query.from);
        const to = parseOptionalDate(req.query.to);
        const data = await getFuelUsageByMonth(req.user!._id, { from, to });
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve fuel usage statistics" });
    }
});

app.get("/dashboard/spending-by-car", validateAccessToken, async (req, res) => {
    try {
        const from = parseOptionalDate(req.query.from);
        const to = parseOptionalDate(req.query.to);
        const data = await getSpendingByCar(req.user!._id, { from, to });
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to retrieve spending statistics" });
    }
});

// ========================================================================================
// Listen for incoming requests
// ========================================================================================

app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
});
