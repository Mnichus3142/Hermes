// =========================================================================================
// This file defines expeneses related types and functions, which represent an expense in the system.
// =========================================================================================

import { connectToDatabase } from "../db/client";
import { ObjectId, WithId } from "mongodb";

export type maintenanceWork = {
    type: String;
    description: String;
    amount: number;
};

export type fuel = {
    type: String;
    volume: number;
    pricePerUnit: number;
};

export type Expense = {
    amount: number;
    date: Date;
    category: "fuel" | "maintenance" | "insurance" | "taxes" | "other";
    description: string;
    carId: ObjectId;
    ownerId: ObjectId;
    maintenanceWorks?: maintenanceWork[];
    fuel?: fuel;
    mileageAtExpense?: number;
};

export type DashboardDateRange = {
    from?: Date;
    to?: Date;
};

const buildNormalizedDateFilter = ({ from, to }: DashboardDateRange) => {
    const filters: Record<string, unknown>[] = [];

    if (from) {
        filters.push({ normalizedDate: { $gte: from } });
    }

    if (to) {
        filters.push({ normalizedDate: { $lte: to } });
    }

    return filters;
};

const normalizeDateField = <T extends { date?: unknown }>(value: T): T => {
    if (typeof value.date === "string") {
        const parsed = new Date(value.date);
        if (!Number.isNaN(parsed.getTime())) {
            return {
                ...value,
                date: parsed,
            };
        }
    }

    return value;
};

export const getCarCurrentMileage = async (
    carId: string,
): Promise<number | null> => {
    const db = await connectToDatabase();
    const car = await db.collection("cars").findOne({ _id: new ObjectId(carId) });
    return car ? car.mileage : null;
};

export const validateExpense = async (
    body: any,
): Promise<[boolean, string?]> => {
    if (body.amount != null && typeof body.amount !== "number") {
        return [false, "Amount must be a number"];
    }
    if (body.date != null && isNaN(Date.parse(body.date))) {
        return [false, "Date must be a valid date string"];
    }
    if (
        body.category != null &&
        !["fuel", "maintenance", "insurance", "taxes", "other"].includes(
            body.category,
        )
    ) {
        return [
            false,
            "Category must be one of: fuel, maintenance, insurance, taxes, other",
        ];
    }
    if (body.description != null && typeof body.description !== "string") {
        return [false, "Description must be a string"];
    }
    if (body.carId != null && typeof body.carId !== "string") {
        return [false, "Car ID must be a string"];
    }
    if (body.ownerId != null && typeof body.ownerId !== "object") {
        return [false, "Owner ID must be a string"];
    }
    if (body.maintenanceWorks != null && !Array.isArray(body.maintenanceWorks)) {
        if (
            body.maintenanceWorks.some(
                (work: any) =>
                    typeof work.type !== "string" ||
                    typeof work.description !== "string" ||
                    typeof work.amount !== "number",
            )
        ) {
            return [
                false,
                "Each maintenance work must have a type (string), description (string) and amount (number)",
            ];
        }
    }

    if (body.fuel != null) {
        if (
            typeof body.fuel.type !== "string" ||
            typeof body.fuel.volume !== "number" ||
            typeof body.fuel.pricePerUnit !== "number"
        ) {
            return [
                false,
                "Fuel must have a type (string), volume (number) and pricePerUnit (number)",
            ];
        }
    }

    if (body.mileageAtExpense != null) {
        if (typeof body.mileageAtExpense !== "number") {
            return [false, "Mileage at expense must be a number"];
        }
        const currentMileage = await getCarCurrentMileage(body.carId);
        if (currentMileage != null && body.mileageAtExpense < currentMileage) {
            return [
                false,
                "Mileage at expense cannot be less than the car's current mileage",
            ];
        }
    }
    return [true];
};

export const getExpenses = async (ownerId: string) => {
    const db = await connectToDatabase();
    const expenses = await db
        .collection<WithId<Expense>>("expenses")
        .find({ ownerId: new ObjectId(ownerId) })
        .toArray();
    return expenses;
};

export const getExpenseById = async (
    expenseId: string,
    ownerId: string,
): Promise<WithId<Expense> | null> => {
    const db = await connectToDatabase();
    return await db
        .collection<Expense>("expenses")
        .findOne({ _id: new ObjectId(expenseId), ownerId: new ObjectId(ownerId) });
};

export const createExpense = async (
    expense: Expense,
): Promise<[boolean, string?]> => {
    const normalizedExpense = normalizeDateField(expense);
    const [valid, errorMessage] = await validateExpense(normalizedExpense);
    if (!valid) {
        return [false, errorMessage];
    }
    try {
        const db = await connectToDatabase();
        const result = await db.collection("expenses").insertOne(normalizedExpense);
        if (!result.acknowledged) {
            return [false, "Failed to create expense"];
        }

        if (normalizedExpense.mileageAtExpense != null) {
            const result2 = await db
                .collection("cars")
                .updateOne(
                    { _id: new ObjectId(normalizedExpense.carId) },
                    { $set: { mileage: normalizedExpense.mileageAtExpense } },
                );
            if (result2.matchedCount === 0) {
                return [false, "Car not found"];
            }
        }

        return [true];
    } catch (error) {
        return [false, (error as Error).message];
    }
};

export const deleteExpense = async (
    expenseId: string,
    ownerId: string,
): Promise<[boolean, string?]> => {
    try {
        const db = await connectToDatabase();
        const result = await db.collection("expenses").deleteOne({
            _id: new ObjectId(expenseId),
            ownerId: new ObjectId(ownerId),
        });
        if (result.deletedCount === 0) {
            return [false, "Expense not found or not owned by user"];
        }
        return [true];
    } catch (error) {
        return [false, (error as Error).message];
    }
};

export const updateExpense = async (
    expenseId: string,
    ownerId: string,
    updatedExpense: Partial<Expense>,
): Promise<[boolean, string?]> => {
    const normalizedExpense = normalizeDateField(updatedExpense);
    const [valid, errorMessage] = await validateExpense(normalizedExpense);
    if (!valid) {
        return [false, errorMessage];
    }
    try {
        const db = await connectToDatabase();
        const result = await db
            .collection("expenses")
            .updateOne(
                { _id: new ObjectId(expenseId), ownerId: new ObjectId(ownerId) },
                { $set: normalizedExpense },
            );
        if (result.matchedCount === 0) {
            return [false, "Expense not found or not owned by user"];
        }

        if (normalizedExpense.mileageAtExpense != null) {
            const result2 = await db
                .collection("cars")
                .updateOne(
                    { _id: normalizedExpense.carId },
                    { $set: { mileage: normalizedExpense.mileageAtExpense } },
                );
            if (result2.matchedCount === 0) {
                return [false, "Car not found"];
            }
        }

        return [true];
    } catch (error) {
        return [false, (error as Error).message];
    }
};

export const getFuelUsageByMonth = async (
    ownerId: ObjectId,
    range: DashboardDateRange = {},
) => {
    const db = await connectToDatabase();
    const normalizedDateFilter = buildNormalizedDateFilter(range);

    const result = await db
        .collection<Expense>("expenses")
        .aggregate([
            { $match: { ownerId, category: "fuel" } },
            {
                $addFields: {
                    normalizedDate: {
                        $convert: {
                            input: "$date",
                            to: "date",
                            onError: null,
                            onNull: null,
                        },
                    },
                },
            },
            {
                $match: {
                    $and: [
                        { normalizedDate: { $ne: null } },
                        ...normalizedDateFilter,
                    ],
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: "$normalizedDate",
                        },
                    },
                    totalFuelVolume: { $sum: { $ifNull: ["$fuel.volume", 0] } },
                    totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
                },
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    month: "$_id",
                    totalFuelVolume: { $round: ["$totalFuelVolume", 2] },
                    totalAmount: { $round: ["$totalAmount", 2] },
                },
            },
        ])
        .toArray();

    return result;
};

export const getSpendingByCar = async (
    ownerId: ObjectId,
    range: DashboardDateRange = {},
) => {
    const db = await connectToDatabase();
    const normalizedDateFilter = buildNormalizedDateFilter(range);

    const result = await db
        .collection<Expense>("expenses")
        .aggregate([
            { $match: { ownerId } },
            {
                $addFields: {
                    normalizedDate: {
                        $convert: {
                            input: "$date",
                            to: "date",
                            onError: null,
                            onNull: null,
                        },
                    },
                },
            },
            {
                $match: {
                    $and: [
                        { normalizedDate: { $ne: null } },
                        ...normalizedDateFilter,
                    ],
                },
            },
            {
                $group: {
                    _id: "$carId",
                    totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
                },
            },
            {
                $lookup: {
                    from: "cars",
                    localField: "_id",
                    foreignField: "_id",
                    as: "car",
                },
            },
            {
                $unwind: {
                    path: "$car",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    carId: { $toString: "$_id" },
                    totalAmount: { $round: ["$totalAmount", 2] },
                    carLabel: {
                        $trim: {
                            input: {
                                $concat: [
                                    { $ifNull: ["$car.make", "Unknown"] },
                                    " ",
                                    { $ifNull: ["$car.model", "car"] },
                                ],
                            },
                        },
                    },
                },
            },
            { $sort: { totalAmount: -1 } },
        ])
        .toArray();

    return result;
};
