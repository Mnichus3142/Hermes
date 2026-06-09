import { redirect, type Handle } from "@sveltejs/kit";

const PUBLIC_ROUTES = ["/"];
const API_PREFIX = "/api";

export const handle: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;

    if (path.startsWith(API_PREFIX)) {
        return resolve(event);
    }

    event.locals.isLoggedIn = false;
    event.locals.username = null;

    let accessToken = event.cookies.get("accessToken");
    const refreshToken = event.cookies.get("refreshToken");

    if (accessToken) {
        if (isAccessTokenExpired(accessToken)) {
            if (refreshToken) {
                const refreshed = await tryRefresh(event, refreshToken);
                if (refreshed) {
                    accessToken = event.cookies.get("accessToken");
                    event.locals.isLoggedIn = Boolean(accessToken);
                } else {
                    event.cookies.delete("accessToken", { path: "/" });
                    event.cookies.delete("refreshToken", { path: "/" });
                }
            } else {
                event.cookies.delete("accessToken", { path: "/" });
            }
        } else {
            event.locals.isLoggedIn = true;
            event.locals.username = getUsernameFromAccessToken(accessToken);
        }
    } else if (refreshToken) {
        const refreshed = await tryRefresh(event, refreshToken);
        if (refreshed) {
            event.locals.isLoggedIn = true;
            accessToken = event.cookies.get("accessToken");
            event.locals.username = accessToken
                ? getUsernameFromAccessToken(accessToken)
                : null;
        } else {
            event.cookies.delete("accessToken", { path: "/" });
            event.cookies.delete("refreshToken", { path: "/" });
        }
    }

    const isPublicRoute = PUBLIC_ROUTES.includes(path);

    if (event.locals.isLoggedIn && isPublicRoute) {
        throw redirect(303, "/dashboard");
    }

    if (isPublicRoute) {
        return resolve(event);
    }

    if (!event.locals.isLoggedIn) {
        return redirectToLogin(event, path);
    }

    return resolve(event);
};

const refreshApiUrl = (origin: string) => `${origin}/api/refresh`;

const tryRefresh = async (
    event: Parameters<Handle>[0]["event"],
    refreshToken: string,
): Promise<boolean> => {
    try {
        const res = await event.fetch(refreshApiUrl(event.url.origin), {
            method: "POST",
            headers: {
                Cookie: `refreshToken=${refreshToken}`,
            },
        });

        if (!res.ok) return false;

        const setCookieHeaders = getSetCookieHeaders(res.headers);
        for (const raw of setCookieHeaders) {
            parseAndSetCookie(event, raw);
        }

        return true;
    } catch {
        return false;
    }
};

const parseAndSetCookie = (event: Parameters<Handle>[0]["event"], raw: string) => {
    const parts = raw.split("; ");
    const firstPair = parts[0];
    const separatorIndex = firstPair.indexOf("=");

    if (separatorIndex === -1) {
        return;
    }

    const name = firstPair.slice(0, separatorIndex);
    const value = firstPair.slice(separatorIndex + 1);

    const maxAgePart = parts.find((p) => p.toLowerCase().startsWith("max-age="));
    const maxAge = maxAgePart
        ? parseInt(maxAgePart.split("=")[1], 10)
        : undefined;

    event.cookies.set(name, value, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        ...(maxAge && { maxAge }),
    });
};

const getSetCookieHeaders = (headers: Headers): string[] => {
    const customHeaders = headers as Headers & {
        getSetCookie?: () => string[];
    };

    if (typeof customHeaders.getSetCookie === "function") {
        return customHeaders.getSetCookie();
    }

    const raw = headers.get("set-cookie");
    if (!raw) {
        return [];
    }

    return raw.split(/,(?=\s*[\w-]+=)/);
};

const isAccessTokenExpired = (token: string): boolean => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            return true;
        }

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const payload = JSON.parse(
            Buffer.from(padded, "base64").toString("utf-8"),
        ) as { exp?: number };

        if (!payload.exp) {
            return true;
        }

        return payload.exp * 1000 <= Date.now() + 10_000;
    } catch {
        return true;
    }
};

const getUsernameFromAccessToken = (token: string): string | null => {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            return null;
        }

        const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
        const payload = JSON.parse(
            Buffer.from(padded, "base64").toString("utf-8"),
        ) as { username?: unknown };

        return typeof payload.username === "string" ? payload.username : null;
    } catch {
        return null;
    }
};

const redirectToLogin = (
    event: Parameters<Handle>[0]["event"],
    path: string,
): never => {
    const encoded = encodeURIComponent(path + event.url.search);

    event.cookies.set("redirectAfterLogin", encoded, {
        path: "/",
        maxAge: 60 * 10,
        httpOnly: false,
        sameSite: "strict",
    });

    throw redirect(303, "/");
};