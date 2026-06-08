import { redirect, type Handle } from "@sveltejs/kit";

const PUBLIC_ROUTES = ["/"];

export const handle: Handle = async ({ event, resolve }) => {
    const path = event.url.pathname;

    event.locals.isLoggedIn = false;
    event.locals.username = null;

    let accessToken = event.cookies.get("accessToken");
    const refreshToken = event.cookies.get("refreshToken");

    if (accessToken) {
        event.locals.isLoggedIn = true;
    } else if (refreshToken) {
        const refreshed = await tryRefresh(event, refreshToken);
        if (refreshed) {
            event.locals.isLoggedIn = true;
            accessToken = event.cookies.get("accessToken"); 
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

async function tryRefresh(event: any, refreshToken: string): Promise<boolean> {
    try {
        const res = await fetch("http://127.0.0.1:8080/refresh", {
            method: "POST",
            headers: {
                Cookie: `refreshToken=${refreshToken}`,
            },
        });

        if (!res.ok) return false;

        const setCookieHeaders = res.headers.getSetCookie();
        for (const raw of setCookieHeaders) {
            parseAndSetCookie(event, raw);
        }

        return true;
    } catch {
        return false;
    }
}

function parseAndSetCookie(event: any, raw: string) {
    const parts = raw.split("; ");
    const [name, value] = parts[0].split("=");

    const maxAgePart = parts.find((p) => p.toLowerCase().startsWith("max-age="));
    const maxAge = maxAgePart
        ? parseInt(maxAgePart.split("=")[1]) * 1000
        : undefined;

    event.cookies.set(name, value, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        ...(maxAge && { maxAge }),
    });
}

function redirectToLogin(event: any, path: string): never {
    const encoded = encodeURIComponent(path + event.url.search);

    event.cookies.set("redirectAfterLogin", encoded, {
        path: "/",
        maxAge: 60 * 10,
        httpOnly: false,
        sameSite: "strict",
    });

    throw redirect(303, "/");
}