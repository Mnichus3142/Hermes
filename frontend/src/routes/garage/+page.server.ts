import { error, fail, type Cookies, type ServerLoadEvent } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
    normalizeCarParameters,
    type CreateCarPayload,
} from "$lib/types/car";

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

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
    let accessToken = cookies.get("accessToken");

    if (!accessToken) {
        throw error(401, "Not authenticated");
    }

    let [carsResponse, parametersResponse] = await Promise.all([
        fetch(apiUrl(url.origin, "/car"), {
            headers: authHeaders(accessToken),
        }),
        fetch(apiUrl(url.origin, "/car/parameters"), {
            headers: authHeaders(accessToken),
        }),
    ]);

    if (carsResponse.status === 401 || parametersResponse.status === 401) {
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

        [carsResponse, parametersResponse] = await Promise.all([
            fetch(apiUrl(url.origin, "/car"), {
                headers: authHeaders(accessToken),
            }),
            fetch(apiUrl(url.origin, "/car/parameters"), {
                headers: authHeaders(accessToken),
            }),
        ]);
    }

    if (!carsResponse.ok) {
        throw error(carsResponse.status, "Failed to load cars");
    }

    const cars = (await parseJsonBody<unknown[]>(carsResponse)) ?? [];

    let parameters = normalizeCarParameters(null);

    if (parametersResponse.ok) {
        parameters = normalizeCarParameters(await parseJsonBody(parametersResponse));
    }

    return { cars, parameters };
};

const getOptionalString = (
    value: FormDataEntryValue | null,
): string | undefined => {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();
    return normalized ? normalized : undefined;
};

const getOptionalNumber = (
    value: FormDataEntryValue | null,
): number | undefined => {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();
    if (!normalized) {
        return undefined;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const getOptionalDate = (value: FormDataEntryValue | null): string | undefined => {
    if (typeof value !== "string") {
        return undefined;
    }

    const normalized = value.trim();
    if (!normalized) {
        return undefined;
    }

    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const compactObject = <T extends Record<string, unknown>>(
    value: T,
): Partial<T> => {
    return Object.fromEntries(
        Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
    ) as Partial<T>;
};

const buildCarFromFormData = (data: FormData): Partial<CreateCarPayload> => {
    const make = getOptionalString(data.get("make"));
    const model = getOptionalString(data.get("model"));

    const payload: Partial<CreateCarPayload> = {
        make: make ?? "",
        model: model ?? "",
        year: getOptionalNumber(data.get("year")),
        type: getOptionalString(data.get("type")),
        mileage: getOptionalNumber(data.get("mileage")),
        color: getOptionalString(data.get("color")),
        vin: getOptionalString(data.get("vin")),
        registrationNumber: getOptionalString(data.get("registrationNumber")),
    };

    const engine = compactObject({
        type: getOptionalString(data.get("engineType")),
        displacement: getOptionalNumber(data.get("engineDisplacement")),
        horsepower: getOptionalNumber(data.get("engineHorsepower")),
        torque: getOptionalNumber(data.get("engineTorque")),
    });

    if (Object.keys(engine).length > 0) {
        payload.engine = engine;
    }

    const transmission = compactObject({
        type: getOptionalString(data.get("transmissionType")),
        gears: getOptionalNumber(data.get("transmissionGears")),
    });

    if (Object.keys(transmission).length > 0) {
        payload.transmission = transmission;
    }

    const dates = compactObject({
        manufactureDate: getOptionalDate(data.get("manufactureDate")),
        registrationDate: getOptionalDate(data.get("registrationDate")),
        insuranceExpiryDate: getOptionalDate(data.get("insuranceExpiryDate")),
        technicalInspectionExpiryDate: getOptionalDate(
            data.get("technicalInspectionExpiryDate"),
        ),
    });

    if (Object.keys(dates).length > 0) {
        payload.dates = dates;
    }

    return payload;
};

export const actions: Actions = {
    create: async ({ request, cookies, fetch }) => {
        let accessToken = cookies.get("accessToken");

        if (!accessToken) {
            return fail(401, { message: "Not authenticated" });
        }

        const car = buildCarFromFormData(await request.formData());

        const requestOrigin = new URL(request.url).origin;
        let response = await fetch(apiUrl(requestOrigin, "/car"), {
            method: "POST",
            headers: {
                ...authHeaders(accessToken),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(car),
        });

        if (response.status === 401) {
            const refreshed = await refreshAccessToken({
                fetch,
                cookies,
                origin: requestOrigin,
            });

            if (!refreshed) {
                return fail(401, { message: "Not authenticated" });
            }

            accessToken = cookies.get("accessToken");
            if (!accessToken) {
                return fail(401, { message: "Not authenticated" });
            }

            response = await fetch(apiUrl(requestOrigin, "/car"), {
                method: "POST",
                headers: {
                    ...authHeaders(accessToken),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(car),
            });
        }

        const result = await response.json();

        if (!response.ok) {
            return fail(response.status, {
                message: result.message ?? "Failed to create car",
            });
        }

        return { success: true };
    },
};
