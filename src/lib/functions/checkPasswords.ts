import type { checkPasswordsType } from '$lib/types/checkPasswords';

export const checkPasswords = (object: checkPasswordsType) => {
    if (object.firstPassword === object.secondPassword) {
        object.doPasswordsMatch = true;
        return object;
    }

    object.doPasswordsMatch = false;
    object.message = 'Passwords do not match';
    return object;
};