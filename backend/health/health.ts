// =========================================================================================
// This file contains the logic for the health check endpoint.
// =========================================================================================

// =========================================================================================
// Function to check the health of the application. Currently, it simply returns a 200 status code.
// =========================================================================================

import { connectToDatabase } from "../db/client";

export const checkHealth = async (): Promise<{ code: number }> => {
    try {
        const db = await connectToDatabase();
        await db.command({ ping: 1 });
        return { code: 200 };
    } catch {
        return { code: 503 };
    }
};
