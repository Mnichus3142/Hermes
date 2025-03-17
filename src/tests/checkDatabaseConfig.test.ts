import { describe, expect, it } from "vitest"
import { env } from "$env/dynamic/private";

describe("#checkDatabaseConfig", () => {
    it("Should return true if the database config is set", () => {
        let result = env.HOST.length > 0 && env.PORT.length > 0 && env.DATABASE.length > 0 && env.DATABASE_USER.length > 0 && env.PASSWORD.length > 0;
        
        expect(result).toBe(true);
    })
})