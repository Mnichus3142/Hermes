import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import { json } from '@sveltejs/kit';
import type { ExpenseType } from '$lib/types/expenseType';
import { ExpenseCategoryEnum } from '$lib/enums/expenseCategoryEnum';

export async function POST(event: RequestEvent) {
    const expenseData: ExpenseType = await event.request.json();
    const userId = event.locals.user?.id;

    if (!userId) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // --- Input Validation ---
    
    // VIN: must be exactly 17 characters (per schema.prisma)
    if (!expenseData.carVin || expenseData.carVin.length !== 17) {
        return json({ success: false, message: 'Invalid VIN number (17 characters required)' }, { status: 400 });
    }

    // Date: must be a valid date format
    const expenseDate = new Date(expenseData.date);
    if (isNaN(expenseDate.getTime())) {
        return json({ success: false, message: 'Invalid date format' }, { status: 400 });
    }

    // Description: max 255 characters
    if (!expenseData.description || expenseData.description.trim().length === 0) {
        return json({ success: false, message: 'Description is required' }, { status: 400 });
    }
    if (expenseData.description.length > 255) {
        return json({ success: false, message: 'Description is too long (max 255 characters)' }, { status: 400 });
    }

    // Amount: must be a positive number
    const amount = Number(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
        return json({ success: false, message: 'Amount must be a positive number' }, { status: 400 });
    }

    // Category: must belong to the defined enum
    if (!Object.values(ExpenseCategoryEnum).includes(expenseData.category)) {
        return json({ success: false, message: 'Invalid expense category' }, { status: 400 });
    }

    // Subcategory: optional, max 50 characters
    if (expenseData.subCategory && expenseData.subCategory.length > 50) {
        return json({ success: false, message: 'Subcategory is too long (max 50 characters)' }, { status: 400 });
    }

    // Mileage: optional, must be a non-negative number
    let mileage: number | null = null;
    if (expenseData.mileage !== undefined && expenseData.mileage !== null) {
        mileage = Number(expenseData.mileage);
        if (isNaN(mileage) || mileage < 0) {
            return json({ success: false, message: 'Mileage must be a non-negative number' }, { status: 400 });
        }
    }

    // Liters: optional, must be a positive number
    let liters: number | null = null;
    if (expenseData.liters !== undefined && expenseData.liters !== null) {
        liters = Number(expenseData.liters);
        if (isNaN(liters) || liters <= 0) {
            return json({ success: false, message: 'Liters must be a positive number' }, { status: 400 });
        }
    }

    // Repair Items: optional, but must be valid if present
    if (expenseData.repairItems) {
        if (!Array.isArray(expenseData.repairItems)) {
            return json({ success: false, message: 'Repair items must be an array' }, { status: 400 });
        }
        for (const item of expenseData.repairItems) {
            if (!item.name || item.name.trim().length === 0) {
                return json({ success: false, message: 'Repair item name is required' }, { status: 400 });
            }
            if (isNaN(Number(item.cost)) || Number(item.cost) < 0) {
                return json({ success: false, message: 'Repair item cost must be a non-negative number' }, { status: 400 });
            }
        }
    }

    try {
        // Verify car ownership
        const car = await prisma.car.findUnique({
            where: { VIN: expenseData.carVin }
        });

        if (!car || car.userId !== userId) {
            return json({ success: false, message: 'Car not found or unauthorized' }, { status: 403 });
        }

        const newExpense = await prisma.expense.create({
            data: {
                carVin: expenseData.carVin,
                date: expenseDate,
                description: expenseData.description.trim(),
                amount: amount,
                category: expenseData.category,
                mileage: mileage,
                liters: liters,
                subCategory: expenseData.subCategory || null,
                repairItems: expenseData.repairItems ? {
                    create: expenseData.repairItems.map(item => ({
                        name: item.name,
                        cost: Number(item.cost),
                        bodyPart: item.bodyPart || null
                    }))
                } : undefined
            },
            include: {
                repairItems: true
            }
        });

        if (mileage && mileage > car.mileage) {
            await prisma.car.update({
                where: { VIN: expenseData.carVin },
                data: { mileage: mileage }
            });
        }

        return json({ success: true, expense: newExpense });

    } catch (error) {
        console.error(error);
        return json({ success: false, message: 'Database error' }, { status: 500 });
    }
}
