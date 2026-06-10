import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
    return {
        isLoggedIn: event.locals.isLoggedIn,
        username: event.locals.username,
    };
};
