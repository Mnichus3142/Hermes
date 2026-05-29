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
    if (body.make != null && typeof body.make !== "string") {
        return [false, "Make must be a string"];
    }

    if (body.model != null && typeof body.model !== "string") {
        return [false, "Model must be a string"];
    }

    if (body.year != null && typeof body.year !== "number") {
        return [false, "Year must be a number"];
    }

    if (body.type != null && !carTypes.includes(body.type)) {
        return [false, `Type must be one of: ${carTypes.join(", ")}`];
    }

    if (body.engine != null) {
        if (typeof body.engine !== "object") {
            return [false, "Engine must be an object"];
        }

        if (body.engine.type != null && !fuelTypes.includes(body.engine.type)) {
            return [false, `Engine type must be one of: ${fuelTypes.join(", ")}`];
        }

        if (
            body.engine.displacement != null &&
            typeof body.engine.displacement !== "number"
        ) {
            return [false, "Engine displacement must be a number"];
        }

        if (
            body.engine.horsepower != null &&
            typeof body.engine.horsepower !== "number"
        ) {
            return [false, "Engine horsepower must be a number"];
        }

        if (body.engine.torque != null && typeof body.engine.torque !== "number") {
            return [false, "Engine torque must be a number"];
        }
    }

    if (body.transmission != null) {
        if (typeof body.transmission !== "object") {
            return [false, "Transmission must be an object"];
        }

        if (
            body.transmission.type != null &&
            !transmissionTypes.includes(body.transmission.type)
        ) {
            return [
                false,
                `Transmission type must be one of: ${transmissionTypes.join(", ")}`,
            ];
        }

        if (
            body.transmission.gears != null &&
            typeof body.transmission.gears !== "number"
        ) {
            return [false, "Transmission gears must be a number"];
        }
    }

    if (body.mileage != null && typeof body.mileage !== "number") {
        return [false, "Mileage must be a number"];
    }

    if (body.color != null && typeof body.color !== "string") {
        return [false, "Color must be a string"];
    }

    if (body.vin != null && typeof body.vin !== "string") {
        return [false, "VIN must be a string"];
    }

    if (
        body.registrationNumber != null &&
        typeof body.registrationNumber !== "string"
    ) {
        return [false, "Registration number must be a string"];
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

export const getCarById = async (
    carId: ObjectId,
    userId: ObjectId,
): Promise<WithId<Car> | null> => {
    const db = await connectToDatabase();
    return await db
        .collection<Car>("cars")
        .findOne({ _id: carId, ownerId: userId });
};

export const deleteCar = async (carId: ObjectId): Promise<boolean> => {
    const db = await connectToDatabase();
    const result = await db.collection("cars").deleteOne({ _id: carId });
    return result.deletedCount === 1;
};

export const updateCar = async (
    carId: ObjectId,
    updateData: Partial<Car>,
): Promise<[boolean, string]> => {
    const [valid, errorMessage] = validateCar(updateData);

    if (!valid) {
        return [false, errorMessage!];
    }

    try {
        const db = await connectToDatabase();
        const result = await db
            .collection("cars")
            .updateOne({ _id: carId }, { $set: updateData });

        if (result.matchedCount === 0) {
            return [false, "Car not found"];
        }

        if (result.modifiedCount === 0) {
            return [false, "No changes made to the car"];
        }

        return [true, ""];
    } catch (error) {
        return [false, (error as Error).message];
    }
};
