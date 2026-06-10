export type ExpenseCategory = "fuel" | "maintenance";

export type Expense = {
    _id: string;
    amount: number;
    date: string;
    category: ExpenseCategory;
    description?: string;
    carId: string;
    mileageAtExpense?: number;
    fuel?: {
        type?: string;
        volume?: number;
        pricePerUnit?: number;
    };
    maintenanceWorks?: Array<{
        type?: string;
        description?: string;
        amount?: number;
    }>;
};
