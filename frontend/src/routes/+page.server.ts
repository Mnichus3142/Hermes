import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    console.log(event.locals.isLoggedIn)
    return {
        isLoggedIn: event.locals.isLoggedIn,
    };
};

import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
    login: async ({ request, fetch, cookies }) => {
        const data = await request.formData();
        const username = data.get('username');
        const password = data.get('password');

        if (!username || !password) {
            return fail(400, { success: false, title: "Błąd", message: "Nazwa użytkownika i hasło są wymagane." });
        }

        try {
            const response = await fetch("http://127.0.0.1:8080/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const resData = await response.json();

            if (!response.ok || !resData.success) {
                return fail(response.status, { 
                    success: false, 
                    title: resData.title || "Błąd logowania", 
                    message: resData.message || "Niepoprawne dane." 
                });
            }

            const redirectPath = cookies.get("redirectAfterLogin");
            if (redirectPath) {
                cookies.delete("redirectAfterLogin", { path: "/" });
            }

            throw redirect(303, redirectPath ? decodeURIComponent(redirectPath) : "/dashboard");

        } catch (err) {
            if (err && typeof err === 'object' && 'status' in err) throw err;
            
            console.error(err);
            return fail(500, { success: false, title: "Błąd serwera", message: "Coś poszło nie tak." });
        }
    }
};