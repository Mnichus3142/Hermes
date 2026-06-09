export type CarParameters = {
    CarType: string[];
    FuelType: string[];
    TransmissionType: string[];
};

export const DEFAULT_CAR_PARAMETERS: CarParameters = {
    CarType: ["sedan", "suv", "truck", "coupe", "convertible"],
    FuelType: ["gasoline", "diesel", "electric", "hybrid"],
    TransmissionType: ["automatic", "manual"],
};

export function normalizeCarParameters(value: unknown): CarParameters {
    if (
        value &&
        typeof value === "object" &&
        Array.isArray((value as CarParameters).CarType) &&
        Array.isArray((value as CarParameters).FuelType) &&
        Array.isArray((value as CarParameters).TransmissionType)
    ) {
        return value as CarParameters;
    }

    return DEFAULT_CAR_PARAMETERS;
}

export type Car = {
    _id?: string;
    make: string;
    model: string;
    year?: number;
    type?: string;
    engine?: {
        type?: string;
        displacement?: number;
        horsepower?: number;
        torque?: number;
    };
    transmission?: {
        type?: string;
        gears?: number;
    };
    mileage?: number;
    color?: string;
    vin?: string;
    registrationNumber?: string;
    dates?: {
        manufactureDate?: string;
        registrationDate?: string;
        insuranceExpiryDate?: string;
        technicalInspectionExpiryDate?: string;
    };
};

export type CreateCarPayload = Omit<Car, "_id">;
