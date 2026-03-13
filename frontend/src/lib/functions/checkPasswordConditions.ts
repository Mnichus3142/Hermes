export const checkPasswordConditions = (password: string) => {
    const conditions = {
        isAtLeast8Characters: false,
        hasAtLeast1UppercaseLetter: false,
        hasAtLeast1LowercaseLetter: false,
        hasAtLeast1Number: false,
        hasAtLeast1SpecialCharacter: false,
        allConditionsMet: false
    };

    if (password.length >= 8) conditions.isAtLeast8Characters = true;
    if (/[A-Z]/.test(password)) conditions.hasAtLeast1UppercaseLetter = true;
    if (/[a-z]/.test(password)) conditions.hasAtLeast1LowercaseLetter = true;
    if (/[0-9]/.test(password)) conditions.hasAtLeast1Number = true;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) conditions.hasAtLeast1SpecialCharacter = true;

    if (conditions.isAtLeast8Characters && conditions.hasAtLeast1UppercaseLetter && conditions.hasAtLeast1LowercaseLetter && conditions.hasAtLeast1Number && conditions.hasAtLeast1SpecialCharacter) conditions.allConditionsMet = true;

    return conditions;
}