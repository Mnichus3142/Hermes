import type { PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import { sanitizeRedirectPath } from "$lib/utils/authRedirect";

const authApiUrl = (requestUrl: string) =>
    new URL("/api/auth", requestUrl).toString();

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

export const load: PageServerLoad = async (event) => {
    return {
        isLoggedIn: event.locals.isLoggedIn,
    };
};

export const actions: Actions = {
    login: async ({ request, fetch, cookies }) => {
        const data = await request.formData();
        const username = data.get("username");
        const password = data.get("password");

        if (!username || !password) {
            return fail(400, {
                success: false,
                title: "Login error",
                message: "Username and password are required.",
            });
        }

        try {
            const response = await fetch(authApiUrl(request.url), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const resData = await response.json();

            if (!response.ok || !resData.success) {
                return fail(response.status, {
                    success: false,
                    title: resData.title || "Login failed",
                    message: resData.message || "Invalid credentials.",
                });
            }

            for (const raw of getSetCookieHeaders(response.headers)) {
                const parts = raw.split("; ");
                const firstPair = parts[0];
                const separatorIndex = firstPair.indexOf("=");

                if (separatorIndex === -1) continue;

                const name = firstPair.slice(0, separatorIndex);
                const value = firstPair.slice(separatorIndex + 1);
                const maxAgePart = parts.find((p) =>
                    p.toLowerCase().startsWith("max-age="),
                );
                const maxAge = maxAgePart
                    ? parseInt(maxAgePart.split("=")[1], 10)
                    : undefined;

                cookies.set(name, value, {
                    path: "/",
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    ...(maxAge && { maxAge }),
                });
            }

            const redirectPath = cookies.get("redirectAfterLogin");
            if (redirectPath) {
                cookies.delete("redirectAfterLogin", { path: "/" });
            }

            throw redirect(303, sanitizeRedirectPath(redirectPath));
        } catch (err) {
            if (err && typeof err === "object" && "status" in err) throw err;

            console.error(err);
            return fail(500, {
                success: false,
                title: "Server error",
                message: "Something went wrong.",
            });
        }
    },
};