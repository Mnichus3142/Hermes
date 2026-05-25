// =========================================================================================
// This file defines the Car class, which represents a car in the system.
// =========================================================================================

import { connectToDatabase } from "../db/client";
import { ObjectId, WithId } from "mongodb";

const carTypes = ["sedan", "suv", "truck", "coupe", "convertible"];
type CarType = (typeof carTypes)[number];

const fuelTypes = ["gasoline", "diesel", "electric", "hybrid"];
type fuel = (typeof fuelTypes)[number];

const transmissionTypes = ["automatic", "manual"];
type transmission = {
    type: (typeof transmissionTypes)[number];
    gears: number;
};

type engine = {
    type: fuel;
    displacement: number;
    horsepower: number;
    torque: number;
};

type dates = {
    manufactureDate: Date;
    registrationDate: Date;
    insuranceExpiryDate: Date;
    technicalInspectionExpiryDate: Date;
};

export const getDefinedParameters = () => {
    return {
        CarType: carTypes,
        FuelType: fuelTypes,
        TransmissionType: transmissionTypes,
    };
};

export type Car = {
    make: string;
    model: string;
    year: number;
    type: CarType;
    engine: engine;
    transmission: transmission;
    mileage: number;
    color: string;
    vin: string;
    registrationNumber: string;
    ownerId: ObjectId;
    dates: dates;
};

export const validateCar = (body: any): [boolean, string?] => {
    const requiredFields: (keyof Car)[] = [
        "make",
        "model",
        "year",
        "type",
        "mileage",
        "color",
        "vin",
        "registrationNumber",
    ];

    for (const field of requiredFields) {
        if (
            body[field] === undefined ||
            body[field] === null ||
            body[field] === ""
        ) {
            return [false, `Missing required field: ${field}`];
        }
    }

    const engineFields: (keyof engine)[] = [
        "type",
        "displacement",
        "horsepower",
        "torque",
    ];
    if (!body.engine || typeof body.engine !== "object") {
        return [false, "Missing required field: engine"];
    }
    for (const field of engineFields) {
        if (body.engine[field] === undefined || body.engine[field] === null) {
            return [false, `Missing required field: engine.${field}`];
        }
    }

    const transmissionFields: (keyof transmission)[] = ["type", "gears"];
    if (!body.transmission || typeof body.transmission !== "object") {
        return [false, "Missing required field: transmission"];
    }
    for (const field of transmissionFields) {
        if (
            body.transmission[field] === undefined ||
            body.transmission[field] === null
        ) {
            return [false, `Missing required field: transmission.${field}`];
        }
    }

    const dateFields: (keyof dates)[] = [
        "manufactureDate",
        "registrationDate",
        "insuranceExpiryDate",
        "technicalInspectionExpiryDate",
    ];
    if (!body.dates || typeof body.dates !== "object") {
        return [false, "Missing required field: dates"];
    }
    for (const field of dateFields) {
        if (body.dates[field] === undefined || body.dates[field] === null) {
            return [false, `Missing required field: dates.${field}`];
        }
    }

    if (!carTypes.includes(body.type)) {
        return [false, `Invalid car type. Allowed types: ${carTypes.join(", ")}`];
    }
    if (!fuelTypes.includes(body.engine.type)) {
        return [false, `Invalid fuel type. Allowed types: ${fuelTypes.join(", ")}`];
    }
    if (!transmissionTypes.includes(body.transmission.type)) {
        return [
            false,
            `Invalid transmission type. Allowed types: ${transmissionTypes.join(", ")}`,
        ];
    }

    return [true];
};

export const createCar = async (car: Car): Promise<[boolean, string]> => {
    const [valid, errorMessage] = validateCar(car);

    if (!valid) {
        return [false, errorMessage!];
    }

    try {
        const db = await connectToDatabase();
        const result = await db.collection("cars").insertOne(car);

        if (!result.acknowledged) {
            return [false, "Failed to create car"];
        }

        return [true, ""];
    } catch (error) {
        return [false, (error as Error).message];
    }
};

export const getCars = async (ownerId: ObjectId): Promise<Car[]> => {
    const db = await connectToDatabase();
    return await db.collection<Car>("cars").find({ ownerId }).toArray();
};
