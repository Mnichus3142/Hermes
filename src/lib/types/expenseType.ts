import { ExpenseCategoryEnum } from "$lib/enums/expenseCategoryEnum";

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
};
