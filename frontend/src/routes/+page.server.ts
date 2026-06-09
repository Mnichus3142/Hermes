import type { PageServerLoad } from "./$types";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

const authApiUrl = (requestUrl: string) =>
    new URL("/api/auth", requestUrl).toString();

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

            const redirectPath = cookies.get("redirectAfterLogin");
            if (redirectPath) {
                cookies.delete("redirectAfterLogin", { path: "/" });
            }

            throw redirect(
                303,
                redirectPath ? decodeURIComponent(redirectPath) : "/dashboard",
            );
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