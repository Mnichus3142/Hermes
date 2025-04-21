import { describe, expect, it } from "vitest"
import { env } from "$env/dynamic/private";

describe('#checkJWTSecret', () => {
    it("Should return true if the JWT secret is set", () => {
        let result = env.JWT_ACCESS_SECRET?.length > 0;
        
        expect(result).toBe(true);
    })
})