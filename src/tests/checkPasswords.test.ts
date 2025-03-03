import { checkPasswords } from "$lib/functions/checkPasswords"
import { describe, expect, it } from "vitest"
import type { checkPasswordsType } from "$lib/types/checkPasswords"

describe('#checkPasswords', () => {
    it("Should return true if the passwords are the same", () => {
        const testObject: checkPasswordsType = {
            doPasswordsMatch: false,
            firstPassword: "Test123!",
            secondPassword: "Test123!",
            message: "",
            conditions: {
                isAtLeast8Characters: false,
                hasAtLeast1UppercaseLetter: false,
                hasAtLeast1LowercaseLetter: false,
                hasAtLeast1Number: false,
                hasAtLeast1SpecialCharacter: false,
                allConditionsMet: false
            }
        }

        const result = checkPasswords(testObject)

        expect(result.doPasswordsMatch).toBe(true)
    })

    it("Should return false and a message if the passwords do not match", () => {
        const testObject: checkPasswordsType = {
            doPasswordsMatch: false,
            firstPassword: "Test123!",
            secondPassword: "Test123?",
            message: "",
            conditions: {
                isAtLeast8Characters: false,
                hasAtLeast1UppercaseLetter: false,
                hasAtLeast1LowercaseLetter: false,
                hasAtLeast1Number: false,
                hasAtLeast1SpecialCharacter: false,
                allConditionsMet: false
            }
        }

        const result = checkPasswords(testObject)

        expect(result.doPasswordsMatch).toBe(false)
        expect(result.message).toBe('Passwords do not match')
    })

    it("All properties should be set to true if passwords are the same", () => {
        const testObject: checkPasswordsType = {
            doPasswordsMatch: false,
            firstPassword: "Test123!",
            secondPassword: "Test123!",
            message: "",
            conditions: {
                isAtLeast8Characters: false,
                hasAtLeast1UppercaseLetter: false,
                hasAtLeast1LowercaseLetter: false,
                hasAtLeast1Number: false,
                hasAtLeast1SpecialCharacter: false,
                allConditionsMet: false
            }
        }

        const result = checkPasswords(testObject)

        expect(result.doPasswordsMatch).toBe(true)
        expect(result.conditions.allConditionsMet).toBe(true)
        expect(result.conditions.hasAtLeast1LowercaseLetter).toBe(true)
        expect(result.conditions.hasAtLeast1Number).toBe(true)
        expect(result.conditions.hasAtLeast1SpecialCharacter).toBe(true)
        expect(result.conditions.hasAtLeast1UppercaseLetter).toBe(true)
        expect(result.conditions.isAtLeast8Characters).toBe(true)
    })

    it("Should return false if at least one condition is not met", () => {
        const testObject: checkPasswordsType = {
            doPasswordsMatch: false,
            firstPassword: "test123!",
            secondPassword: "Test123!",
            message: "",
            conditions: {
                isAtLeast8Characters: false,
                hasAtLeast1UppercaseLetter: false,
                hasAtLeast1LowercaseLetter: false,
                hasAtLeast1Number: false,
                hasAtLeast1SpecialCharacter: false,
                allConditionsMet: false
            }
        }

        const result = checkPasswords(testObject)

        expect(result.doPasswordsMatch).toBe(false)
    })
})