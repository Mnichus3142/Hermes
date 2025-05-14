import { describe, expect, it } from "vitest"
import { verifyConnection } from "../sql/prismaSetup"

describe('#checkDatabase', async () => {
    it('Should return true if connection with database is established', async () => {
        const result = await verifyConnection();
        expect(result).toBe(true);
    })
})