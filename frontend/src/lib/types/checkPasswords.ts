type checkPasswordsType = {
    doPasswordsMatch: boolean;
    firstPassword: string;
    secondPassword: string;
    message: string;
    conditions: {
        isAtLeast8Characters: boolean;
        hasAtLeast1UppercaseLetter: boolean;
        hasAtLeast1LowercaseLetter: boolean;
        hasAtLeast1Number: boolean;
        hasAtLeast1SpecialCharacter: boolean;
        allConditionsMet: boolean;
    }
};

export type { checkPasswordsType }