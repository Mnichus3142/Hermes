import { checkPasswordConditions } from './checkPasswordConditions';
import type { checkPasswordsType } from '$lib/types/checkPasswords';

export const checkPasswords = (object: checkPasswordsType) => {
    object.conditions = checkPasswordConditions(object.firstPassword);

    if (object.firstPassword === object.secondPassword) {
        object.doPasswordsMatch = true;
        return object;
    }

    object.doPasswordsMatch = false;
    object.message = 'Passwords do not match';
    return object;
};