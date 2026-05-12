// =========================================================================================
// This file contains the logic for the health check endpoint.
// =========================================================================================

// =========================================================================================
// Function to check the health of the application. Currently, it simply returns a 200 status code.
// =========================================================================================

export const checkHealth = async (): Promise<{ code: number }> => {
    return { code: 200 };
};
