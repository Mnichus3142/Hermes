import { error, fail, type Cookies, type ServerLoadEvent } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
    normalizeCarParameters,
    type Car,
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
    try {
        if (response.bodyUsed) {
            return null;
        }

        const body = await response.text();
        if (!body) {
            return null;
        }

        return JSON.parse(body) as T;
    } catch {
        return null;
    }
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
    const payload: Partial<CreateCarPayload> = compactObject({
        make: getOptionalString(data.get("make")),
        model: getOptionalString(data.get("model")),
        year: getOptionalNumber(data.get("year")),
        type: getOptionalString(data.get("type")),
        mileage: getOptionalNumber(data.get("mileage")),
        color: getOptionalString(data.get("color")),
        vin: getOptionalString(data.get("vin")),
        registrationNumber: getOptionalString(data.get("registrationNumber")),
    });

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

type ExpenseCategory = "fuel" | "maintenance";

type GarageExpense = {
    _id: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    description?: string;
    carId: string;
    mileageAtExpense?: number;
    fuel?: {
        type: string;
        volume: number;
        pricePerUnit: number;
    };
    maintenanceWorks?: Array<{
        type: string;
        description: string;
        amount: number;
    }>;
};

const buildExpensePayload = (
    data: FormData,
    carId: string,
    fuelTypeOverride?: string,
): Record<string, unknown> => {
    const category = getOptionalString(data.get("category"));
    if (category !== "fuel" && category !== "maintenance") {
        return { category: "other", carId };
    }

    const rawAmount = getOptionalNumber(data.get("amount"));
    const mileageAtExpense = getOptionalNumber(data.get("mileageAtExpense"));
    const date = getOptionalDate(data.get("date")) ?? new Date().toISOString();
    const description = getOptionalString(data.get("description"));
    const fuelType = getOptionalString(data.get("fuelType"));
    const fuelVolume = getOptionalNumber(data.get("fuelVolume"));
    const fuelPricePerUnit = getOptionalNumber(data.get("fuelPricePerUnit"));
    const maintenanceType = getOptionalString(data.get("maintenanceType"));

    const amount =
        category === "fuel" &&
        fuelVolume !== undefined &&
        fuelPricePerUnit !== undefined
            ? Number((fuelVolume * fuelPricePerUnit).toFixed(2))
            : rawAmount;

    const payload: Record<string, unknown> = compactObject({
        carId,
        category,
        amount,
        date,
        description,
        mileageAtExpense,
    });

    if (category === "fuel") {
        const resolvedFuelType = fuelTypeOverride ?? fuelType;
        payload.fuel = compactObject({
            type: resolvedFuelType,
            volume: fuelVolume,
            pricePerUnit: fuelPricePerUnit,
        });
    }

    if (category === "maintenance") {
        payload.maintenanceWorks = [
            compactObject({
                type: maintenanceType,
                description: description ?? "",
                amount,
            }),
        ];
    }

    return payload;
};

const getCarFuelType = async ({
    fetch,
    origin,
    accessToken,
    carId,
}: {
    fetch: ServerLoadEvent["fetch"];
    origin: string;
    accessToken: string;
    carId: string;
}): Promise<string | undefined> => {
    const response = await fetch(apiUrl(origin, `/car/${carId}`), {
        headers: authHeaders(accessToken),
    });

    if (!response.ok) {
        return undefined;
    }

    const car = await parseJsonBody<Car>(response);
    const engineType =
        typeof car?.engine?.type === "string" ? car.engine.type.trim() : "";

    return engineType ? engineType : undefined;
};

export const load: PageServerLoad = async ({ cookies, fetch, url, params }) => {
    let accessToken = cookies.get("accessToken");

    if (!accessToken) {
        throw error(401, "Not authenticated");
    }

    const carId = params.id;

    let [carResponse, expensesResponse, parametersResponse] = await Promise.all([
        fetch(apiUrl(url.origin, `/car/${carId}`), {
            headers: authHeaders(accessToken),
        }),
        fetch(apiUrl(url.origin, "/expense"), {
            headers: authHeaders(accessToken),
        }),
        fetch(apiUrl(url.origin, "/car/parameters"), {
            headers: authHeaders(accessToken),
        }),
    ]);

    if (carResponse.status === 401) {
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

        [carResponse, expensesResponse, parametersResponse] = await Promise.all([
            fetch(apiUrl(url.origin, `/car/${carId}`), {
                headers: authHeaders(accessToken),
            }),
            fetch(apiUrl(url.origin, "/expense"), {
                headers: authHeaders(accessToken),
            }),
            fetch(apiUrl(url.origin, "/car/parameters"), {
                headers: authHeaders(accessToken),
            }),
        ]);
    }

    if (!carResponse.ok) {
        throw error(carResponse.status, "Failed to load car");
    }

    const car = await parseJsonBody<Car>(carResponse);
    if (!car) {
        throw error(500, "Failed to parse car payload");
    }

    const allExpenses = expensesResponse.ok
        ? ((await parseJsonBody<GarageExpense[]>(expensesResponse)) ?? [])
        : [];
    const expenses = allExpenses.filter(
        (expense) => String(expense.carId) === String(car._id),
    );

    const parameters = parametersResponse.ok
        ? normalizeCarParameters(await parseJsonBody(parametersResponse))
        : normalizeCarParameters(null);

    return { car, expenses, parameters };
};

export const actions: Actions = {
    updateCar: async ({ request, cookies, fetch, params }) => {
        const accessToken = cookies.get("accessToken");

        if (!accessToken) {
            return fail(401, { message: "Not authenticated" });
        }

        const payload = buildCarFromFormData(await request.formData());

        const response = await fetch(
            apiUrl(new URL(request.url).origin, `/car/${params.id}`),
            {
                method: "PATCH",
                headers: {
                    ...authHeaders(accessToken),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        );

        const result = await response.json();

        if (!response.ok) {
            return fail(response.status, {
                message: result.message ?? "Failed to update car",
            });
        }

        return { success: true };
    },
    createExpense: async ({ request, cookies, fetch, params }) => {
        const accessToken = cookies.get("accessToken");

        if (!accessToken) {
            return fail(401, { message: "Not authenticated" });
        }

        const formData = await request.formData();
        const category = getOptionalString(formData.get("category"));
        const enforcedFuelType = await getCarFuelType({
            fetch,
            origin: new URL(request.url).origin,
            accessToken,
            carId: params.id,
        });

        if (category === "fuel" && !enforcedFuelType) {
            return fail(400, {
                message:
                    "Fuel expense requires car engine type. Set engine type for this car first.",
            });
        }

        const payload = buildExpensePayload(formData, params.id, enforcedFuelType);

        const response = await fetch(apiUrl(new URL(request.url).origin, "/expense"), {
            method: "POST",
            headers: {
                ...authHeaders(accessToken),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!response.ok) {
            return fail(response.status, {
                message: result.message ?? "Failed to create expense",
            });
        }

        return { success: true };
    },
    updateExpense: async ({ request, cookies, fetch, params }) => {
        const accessToken = cookies.get("accessToken");

        if (!accessToken) {
            return fail(401, { message: "Not authenticated" });
        }

        const formData = await request.formData();
        const expenseId = getOptionalString(formData.get("expenseId"));

        if (!expenseId) {
            return fail(400, { message: "Missing expense id" });
        }

        const category = getOptionalString(formData.get("category"));
        const enforcedFuelType = await getCarFuelType({
            fetch,
            origin: new URL(request.url).origin,
            accessToken,
            carId: params.id,
        });

        if (category === "fuel" && !enforcedFuelType) {
            return fail(400, {
                message:
                    "Fuel expense requires car engine type. Set engine type for this car first.",
            });
        }

        const payload = buildExpensePayload(formData, params.id, enforcedFuelType);

        const response = await fetch(
            apiUrl(new URL(request.url).origin, `/expense/${expenseId}`),
            {
                method: "PATCH",
                headers: {
                    ...authHeaders(accessToken),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            },
        );

        const result = await response.json();

        if (!response.ok) {
            return fail(response.status, {
                message: result.message ?? "Failed to update expense",
            });
        }

        return { success: true };
    },
    deleteExpense: async ({ request, cookies, fetch }) => {
        const accessToken = cookies.get("accessToken");

        if (!accessToken) {
            return fail(401, { message: "Not authenticated" });
        }

        const formData = await request.formData();
        const expenseId = getOptionalString(formData.get("expenseId"));

        if (!expenseId) {
            return fail(400, { message: "Missing expense id" });
        }

        const response = await fetch(
            apiUrl(new URL(request.url).origin, `/expense/${expenseId}`),
            {
                method: "DELETE",
                headers: authHeaders(accessToken),
            },
        );

        const result = await response.json();

        if (!response.ok) {
            return fail(response.status, {
                message: result.message ?? "Failed to delete expense",
            });
        }

        return { success: true };
    },
};
