import { describe, expect, it } from "vitest"
import { env } from "$env/dynamic/private";

describe("#checkDatabaseConfig", () => {
    it("Should return true if the database config is set", () => {
        let result = env.DATABASE_URL.length > 0;
        
        expect(result).toBe(true);
    })
})