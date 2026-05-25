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
            user?: DbUser;
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

const findUserByRefreshToken = async (
    refreshToken: string,
): Promise<DbUser | null> => {
    const db = await connectToDatabase();
    return db.collection<DbUser>("users").findOne({ refreshToken });
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
        const user = await db.collection<DbUser>("users").findOne({
            _id: new ObjectId(payload.userId),
        });

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
        jwt.verify(refreshToken, getSecret("JWT_REFRESH_SECRET"));
    } catch {
        res.status(401).json({ message: "Invalid or expired refresh token" });
        return;
    }

    try {
        const user = await findUserByRefreshToken(refreshToken);

        if (!user) {
            res.status(401).json({ message: "Refresh token has been revoked" });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(500).json({ message: "Error processing request" });
    }
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
        const existing = await db.collection<DbUser>("users").findOne({ username });
        return existing === null;
    }

    async create(
        username: string,
        password: string,
    ): Promise<[boolean, string?]> {
        if (!(await this.checkAvailability(username))) {
            return [false, "Username is already taken"];
        }

        try {
            const db = await connectToDatabase();
            const passwordHash = await bcrypt.hash(password, 10);
            const result = await db.collection<DbUser>("users").insertOne({
                username,
                password: passwordHash,
                refreshToken: null,
            } as WithId<DbUser>);

            return result.acknowledged ? [true] : [false, "Failed to create user"];
        } catch {
            return [false, "Error processing request"];
        }
    }

    async login(
        username: string,
        password: string,
    ): Promise<[boolean, AuthTokens | string]> {
        try {
            const db = await connectToDatabase();
            const user = await db.collection<DbUser>("users").findOne({ username });

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return [false, "Invalid username or password"];
            }

            const accessToken = this.generateAccessToken(user);
            const refreshToken = this.generateRefreshToken(user);

            await db
                .collection<DbUser>("users")
                .updateOne({ _id: user._id }, { $set: { refreshToken } });

            return [true, { accessToken, refreshToken }];
        } catch {
            return [false, "Error processing request"];
        }
    }

    async refresh(refreshToken: string): Promise<[boolean, AuthTokens | string]> {
        try {
            jwt.verify(refreshToken, getSecret("JWT_REFRESH_SECRET"));
        } catch {
            return [false, "Invalid or expired refresh token"];
        }

        try {
            const user = await findUserByRefreshToken(refreshToken);

            if (!user) {
                return [false, "Refresh token has been revoked"];
            }

            const newAccessToken = this.generateAccessToken(user);
            const newRefreshToken = this.generateRefreshToken(user);

            await (await connectToDatabase())
                .collection<DbUser>("users")
                .updateOne(
                    { _id: user._id },
                    { $set: { refreshToken: newRefreshToken } },
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
        try {
            jwt.verify(refreshToken, getSecret("JWT_REFRESH_SECRET"));
        } catch {
            return [false, "Invalid or expired refresh token"];
        }

        try {
            const db = await connectToDatabase();
            const result = await db
                .collection<DbUser>("users")
                .updateOne({ refreshToken }, { $set: { refreshToken: null } });

            return result.matchedCount > 0
                ? [true]
                : [false, "Refresh token not found"];
        } catch {
            return [false, "Error processing request"];
        }
    }
}
