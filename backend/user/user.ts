import { connectToDatabase } from "../db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId, WithId } from "mongodb";
import { Request, Response, NextFunction } from "express";

// ========================================================================================
// Types
// ========================================================================================

interface DbUser {
    _id: ObjectId;
    username: string;
    password: string;
    refreshToken?: string | null;
}

interface AuthenticatedUser {
    _id: ObjectId;
    username: string;
    refreshToken?: string | null;
}

interface TokenPayload {
    userId: string;
    username: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

// ========================================================================================
// Helpers
// ========================================================================================

const getSecret = (key: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string => {
    const secret = process.env[key];
    if (!secret) throw new Error(`${key} is not set`);
    return secret;
};

const findUserById = async (userId: string): Promise<DbUser | null> => {
    const db = await connectToDatabase();
    if (!ObjectId.isValid(userId)) {
        return null;
    }
    return db.collection<DbUser>("users").findOne({ _id: new ObjectId(userId) });
};

const ensureUserIndexes = async () => {
    const db = await connectToDatabase();
    await db.collection<DbUser>("users").createIndex({ username: 1 }, { unique: true });
};

// ========================================================================================
// Middleware
// ========================================================================================

export const validateAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ message: "Access token is required" });
        return;
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const payload = jwt.verify(
            accessToken,
            getSecret("JWT_SECRET"),
        ) as TokenPayload;

        const db = await connectToDatabase();
        const user = await db.collection<DbUser>("users").findOne(
            {
                _id: new ObjectId(payload.userId),
            },
            {
                projection: {
                    password: 0,
                },
            },
        );

        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(401).json({ message: "Invalid or expired access token" });
    }
};

export const validateRefreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        res.status(401).json({ message: "Refresh token is required" });
        return;
    }

    try {
        const payload = jwt.verify(
            refreshToken,
            getSecret("JWT_REFRESH_SECRET"),
        ) as TokenPayload;
        const user = await findUserById(payload.userId);

        if (
            !user?.refreshToken ||
            !(await bcrypt.compare(refreshToken, user.refreshToken))
        ) {
            res.status(401).json({ message: "Refresh token has been revoked" });
            return;
        }

        req.user = {
            _id: user._id,
            username: user.username,
            refreshToken: user.refreshToken,
        };
    } catch {
        res.status(401).json({ message: "Invalid or expired refresh token" });
        return;
    }
    next();
};

// ========================================================================================
// User class
// ========================================================================================

export class User {
    private generateAccessToken(user: DbUser): string {
        return jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
            } satisfies TokenPayload,
            getSecret("JWT_SECRET"),
            { expiresIn: "15m" },
        );
    }

    private generateRefreshToken(user: DbUser): string {
        return jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
            } satisfies TokenPayload,
            getSecret("JWT_REFRESH_SECRET"),
            { expiresIn: "7d" },
        );
    }

    async checkAvailability(username: string): Promise<boolean> {
        const db = await connectToDatabase();
        const existing = await db
            .collection<DbUser>("users")
            .findOne({ username: username.trim() });
        return existing === null;
    }

    async create(
        username: string,
        password: string,
    ): Promise<[boolean, string?]> {
        const normalizedUsername = username.trim();
        if (!normalizedUsername) {
            return [false, "Username is required"];
        }
        if (normalizedUsername.length < 3 || normalizedUsername.length > 64) {
            return [false, "Username must be between 3 and 64 characters"];
        }
        if (password.length < 8 || password.length > 128) {
            return [false, "Password must be between 8 and 128 characters"];
        }
        if (
            !/[a-z]/.test(password) ||
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[^A-Za-z0-9]/.test(password)
        ) {
            return [
                false,
                "Password must contain uppercase, lowercase, number and special character",
            ];
        }
        if (!(await this.checkAvailability(normalizedUsername))) {
            return [false, "Username is already taken"];
        }

        try {
            const db = await connectToDatabase();
            await ensureUserIndexes();
            const passwordHash = await bcrypt.hash(password, 10);
            const result = await db.collection<DbUser>("users").insertOne({
                username: normalizedUsername,
                password: passwordHash,
                refreshToken: null,
            } as WithId<DbUser>);

            return result.acknowledged ? [true] : [false, "Failed to create user"];
        } catch {
            return [false, "Username is already taken"];
        }
    }

    async login(
        username: string,
        password: string,
    ): Promise<[boolean, AuthTokens | string]> {
        try {
            const db = await connectToDatabase();
            const user = await db
                .collection<DbUser>("users")
                .findOne({ username: username.trim() });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return [false, "Invalid username or password"];
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);
            const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

            await db
                .collection<DbUser>("users")
                .updateOne({ _id: user._id }, { $set: { refreshToken: refreshTokenHash } });

            return [true, { accessToken, refreshToken }];
        } catch {
            return [false, "Error processing request"];
        }
    }

    async refresh(refreshToken: string): Promise<[boolean, AuthTokens | string]> {
        let payload: TokenPayload;
        try {
            payload = jwt.verify(
                refreshToken,
                getSecret("JWT_REFRESH_SECRET"),
            ) as TokenPayload;
        } catch {
            return [false, "Invalid or expired refresh token"];
        }

        try {
            const user = await findUserById(payload.userId);

            if (
                !user?.refreshToken ||
                !(await bcrypt.compare(refreshToken, user.refreshToken))
            ) {
                return [false, "Refresh token has been revoked"];
            }

            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);
            const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

            await (await connectToDatabase())
                .collection<DbUser>("users")
                .updateOne(
                    { _id: user._id },
                    { $set: { refreshToken: newRefreshTokenHash } },
                );

            return [
                true,
                { accessToken: newAccessToken, refreshToken: newRefreshToken },
            ];
        } catch {
            return [false, "Error processing request"];
        }
    }

    async logout(refreshToken: string): Promise<[boolean, string?]> {
        let payload: TokenPayload;
        try {
            payload = jwt.verify(
                refreshToken,
                getSecret("JWT_REFRESH_SECRET"),
            ) as TokenPayload;
        } catch {
            return [false, "Invalid or expired refresh token"];
        }

        try {
            const user = await findUserById(payload.userId);
            if (
                !user?.refreshToken ||
                !(await bcrypt.compare(refreshToken, user.refreshToken))
            ) {
                return [false, "Refresh token not found"];
            }
            const db = await connectToDatabase();
            const result = await db
                .collection<DbUser>("users")
                .updateOne({ _id: user._id }, { $set: { refreshToken: null } });

            return result.matchedCount > 0
                ? [true]
                : [false, "Refresh token not found"];
        } catch {
            return [false, "Error processing request"];
        }
    }
}
