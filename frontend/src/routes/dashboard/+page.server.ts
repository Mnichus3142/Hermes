import { error, type Cookies, type ServerLoadEvent } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

const API_PATH = "/api";

const apiUrl = (origin: string, path: string) => `${origin}${API_PATH}${path}`;

const authHeaders = (accessToken: string) => ({
    Authorization: `Bearer ${accessToken}`,
});

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

const parseAndSetCookie = (cookies: Cookies, raw: string) => {
    const parts = raw.split("; ");
    const [nameValue, ...rest] = parts;
    const separatorIndex = nameValue.indexOf("=");

    if (separatorIndex === -1) {
        return;
    }

    const name = nameValue.slice(0, separatorIndex);
    const value = nameValue.slice(separatorIndex + 1);
    const maxAgeRaw = rest.find((part) =>
        part.toLowerCase().startsWith("max-age="),
    );
    const maxAge = maxAgeRaw ? Number(maxAgeRaw.split("=")[1]) : undefined;

    cookies.set(name, value, {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        ...(Number.isFinite(maxAge) ? { maxAge } : {}),
    });
};

const refreshAccessToken = async ({
    fetch,
    cookies,
    origin,
}: {
    fetch: ServerLoadEvent["fetch"];
    cookies: Cookies;
    origin: string;
}) => {
    const refreshToken = cookies.get("refreshToken");
    if (!refreshToken) {
        return false;
    }

    const response = await fetch(apiUrl(origin, "/refresh"), {
        method: "POST",
        headers: {
            Cookie: `refreshToken=${refreshToken}`,
        },
    });

    if (!response.ok) {
        return false;
    }

    for (const raw of getSetCookieHeaders(response.headers)) {
        parseAndSetCookie(cookies, raw);
    }

    return Boolean(cookies.get("accessToken"));
};

const parseJsonBody = async <T>(response: Response): Promise<T | null> => {
    const body = await response.text();
    if (!body) {
        return null;
    }

    try {
        return JSON.parse(body) as T;
    } catch {
        return null;
    }
};

type FuelByMonthItem = {
    month: string;
    totalFuelVolume: number;
    totalAmount: number;
};

type SpendingByCarItem = {
    carId: string;
    carLabel: string;
    totalAmount: number;
};

type DashboardExpenseItem = {
    _id: string;
    amount: number;
    date: string;
    category: string;
    carId: string;
    fuel?: {
        volume?: number;
        pricePerUnit?: number;
    };
};

type DashboardCar = {
    _id: string;
    make?: string;
    model?: string;
};

const loadDashboardData = async ({
    fetch,
    origin,
    accessToken,
}: {
    fetch: ServerLoadEvent["fetch"];
    origin: string;
    accessToken: string;
}) => {
    const [fuelByMonthResponse, spendingByCarResponse, expensesResponse, carsResponse] =
        await Promise.all([
            fetch(apiUrl(origin, "/dashboard/fuel-by-month"), {
                headers: authHeaders(accessToken),
            }),
            fetch(apiUrl(origin, "/dashboard/spending-by-car"), {
                headers: authHeaders(accessToken),
            }),
            fetch(apiUrl(origin, "/expense"), {
                headers: authHeaders(accessToken),
            }),
            fetch(apiUrl(origin, "/car"), {
                headers: authHeaders(accessToken),
            }),
        ]);

    return {
        fuelByMonthResponse,
        spendingByCarResponse,
        expensesResponse,
        carsResponse,
    };
};

export const load: PageServerLoad = async ({ cookies, fetch, url, parent }) => {
    const layoutData = await parent();
    let accessToken = cookies.get("accessToken");

    if (!accessToken) {
        throw error(401, "Not authenticated");
    }

    let {
        fuelByMonthResponse,
        spendingByCarResponse,
        expensesResponse,
        carsResponse,
    } = await loadDashboardData({
        fetch,
        origin: url.origin,
        accessToken,
    });

    if (
        fuelByMonthResponse.status === 401 ||
        spendingByCarResponse.status === 401 ||
        expensesResponse.status === 401 ||
        carsResponse.status === 401
    ) {
        const refreshed = await refreshAccessToken({
            fetch,
            cookies,
            origin: url.origin,
        });

        if (!refreshed) {
            throw error(401, "Not authenticated");
        }

        accessToken = cookies.get("accessToken");
        if (!accessToken) {
            throw error(401, "Not authenticated");
        }

        ({
            fuelByMonthResponse,
            spendingByCarResponse,
            expensesResponse,
            carsResponse,
        } = await loadDashboardData({
            fetch,
            origin: url.origin,
            accessToken,
        }));
    }

    if (!fuelByMonthResponse.ok || !spendingByCarResponse.ok) {
        throw error(500, "Failed to load dashboard charts");
    }

    const fuelByMonth =
        (await parseJsonBody<FuelByMonthItem[]>(fuelByMonthResponse)) ?? [];
    const spendingByCar =
        (await parseJsonBody<SpendingByCarItem[]>(spendingByCarResponse)) ?? [];
    const expenses = (await parseJsonBody<DashboardExpenseItem[]>(expensesResponse)) ?? [];
    const cars = (await parseJsonBody<DashboardCar[]>(carsResponse)) ?? [];

    return {
        username:
            typeof layoutData.username === "string" ? layoutData.username : null,
        fuelByMonth,
        spendingByCar,
        expenses,
        cars,
    };
};
