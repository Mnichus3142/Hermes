// =========================================================================================
// This file defines the User class, which represents a user in the system.
// =========================================================================================

import { connectToDatabase } from "../db/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class User {
    generateAccessToken(user) {
        return jwt.sign(
            {
                userId: user._id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "15m",
            },
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            {
                userId: user._id,
                username: user.username,
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: "7d",
            },
        );
    }

    async checkAvailability(username: string): Promise<boolean> {
        const db = await connectToDatabase();
        const collection = db.collection("users");
        const existingUser = await collection.findOne({ username: username });
        return existingUser === null;
    }

    async create(
        username: string,
        password: string,
    ): Promise<[boolean, string?]> {
        const isAvailable = await this.checkAvailability(username);

        if (!isAvailable) {
            return [false, "Username is already taken"];
        }

        try {
            const db = await connectToDatabase();
            const collection = db.collection("users");

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await collection.insertOne({
                username: username,
                password: passwordHash,
            });

            return [
                result.acknowledged,
                result.acknowledged ? undefined : "Failed to create user",
            ];
        } catch (error) {
            return [false, "Error processing request"];
        }
    }

    async login(username: string, password: string): Promise<[boolean, any]> {
        try {
            const db = await connectToDatabase();
            const collection = db.collection("users");

            const user = await collection.findOne({ username: username });

            if (!user) {
                return [false, "Invalid username or password"];
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return [false, "Invalid username or password"];
            }

            const [accessToken, refreshToken] = [
                this.generateAccessToken(user),
                this.generateRefreshToken(user),
            ];

            try {
                await collection.findOneAndUpdate(
                    { _id: user._id },
                    { $set: { refreshToken: refreshToken } },
                    { returnDocument: "after" },
                );

                return [true, { accessToken, refreshToken }];
            } catch (error) {
                return [false, "Error processing request"];
            }
        } catch (error) {
            return [false, "Error processing request"];
        }
    }
}
