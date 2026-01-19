export type ExpenseType = {
    id?: number;
    carVin: string;
    date: Date | string;
    description: string;
    amount: number;
    category: 'FUEL' | 'REPAIR' | 'INSURANCE' | 'MAINTENANCE' | 'OTHER';
    subCategory?: string;
    mileage?: number;
    liters?: number;
};
