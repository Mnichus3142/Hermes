const isSafePath = (value: string): boolean => {
    return (
        value.startsWith("/") &&
        !value.startsWith("//") &&
        !value.includes("://") &&
        !value.startsWith("/\\")
    );
};

export const sanitizeRedirectPath = (
    rawValue: string | null | undefined,
    fallback = "/dashboard",
): string => {
    if (!rawValue) {
        return fallback;
    }

    let decoded: string;
    try {
        decoded = decodeURIComponent(rawValue);
    } catch {
        return fallback;
    }

    return isSafePath(decoded) ? decoded : fallback;
};
