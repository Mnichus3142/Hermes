import { describe, expect, it } from "vitest"
import { verifyConnection, verifyTables } from "../sql/prepareDatabase"

describe('#checkDatabase', async () => {
    it('Should return true if connection with database is established', async () => {
        const result = await verifyConnection();
        expect(result).toBe(true);
    })

    it('Should return true if there are good tables in database', async () => {
        const result = await verifyTables();
        expect(result).toBe(true);
    })
})