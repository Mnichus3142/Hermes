export type ExpenseCategoryEnum =
    | "fuel"
    | "maintenance"
    | "insurance"
    | "taxes"
    | "other";

export type BodyPartEnum =
    | "engine"
    | "transmission"
    | "suspension"
    | "brakes"
    | "body"
    | "other";

export type RepairItemType = {
    id?: number;
    name: string;
    cost: number;
    bodyPart?: BodyPartEnum;
}

export type ExpenseType = {
    id?: number;
    carVin: string;
    date: Date | string;
    description: string;
    amount: number;
    category: ExpenseCategoryEnum;
    subCategory?: string;
    mileage?: number;
    liters?: number;
    repairItems?: RepairItemType[];
};
