export const checkPasswords = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
        return false;
    }
};