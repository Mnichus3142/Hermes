import { clearSpaces } from "$lib/functions/clearSpaces"
import { describe, expect, it } from "vitest"

describe('#clearSpaces', () => {
    it("Should return clear password", () => {
        expect(clearSpaces("z aq12wsx")).toBe("zaq12wsx")
    })

    it("Should return clear password", () => {
        expect(clearSpaces("z aq     12w  sx")).toBe("zaq12wsx")
    })
})