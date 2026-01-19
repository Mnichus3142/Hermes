import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import { json } from '@sveltejs/kit';
import type { ExpenseType } from '$lib/types/expenseType';
import { ExpenseCategoryEnum } from '$lib/enums/expenseCategoryEnum';

export async function PUT(event: RequestEvent) {
    const expenseData: ExpenseType = await event.request.json();
    const userId = event.locals.user?.id;

    if (!userId) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // --- Input Validation ---
    
    if (!expenseData.id || isNaN(Number(expenseData.id))) {
        return json({ success: false, message: 'Invalid expense ID' }, { status: 400 });
    }

    if (!expenseData.carVin || expenseData.carVin.length !== 17) {
        return json({ success: false, message: 'Invalid VIN number' }, { status: 400 });
    }

    const expenseDate = new Date(expenseData.date);
    if (isNaN(expenseDate.getTime())) {
        return json({ success: false, message: 'Invalid date format' }, { status: 400 });
    }

    if (!expenseData.description || expenseData.description.trim().length === 0) {
        return json({ success: false, message: 'Description is required' }, { status: 400 });
    }
    if (expenseData.description.length > 255) {
        return json({ success: false, message: 'Description is too long (max 255 characters)' }, { status: 400 });
    }

    const amount = Number(expenseData.amount);
    if (isNaN(amount) || amount <= 0) {
        return json({ success: false, message: 'Amount must be a positive number' }, { status: 400 });
    }

    if (!Object.values(ExpenseCategoryEnum).includes(expenseData.category)) {
        return json({ success: false, message: 'Invalid expense category' }, { status: 400 });
    }

    if (expenseData.subCategory && expenseData.subCategory.length > 50) {
        return json({ success: false, message: 'Subcategory is too long (max 50 characters)' }, { status: 400 });
    }

    let mileage: number | null = null;
    if (expenseData.mileage !== undefined && expenseData.mileage !== null && expenseData.mileage !== '') {
        mileage = Number(expenseData.mileage);
        if (isNaN(mileage) || mileage < 0) {
            return json({ success: false, message: 'Mileage must be a non-negative number' }, { status: 400 });
        }
    }

    let liters: number | null = null;
    if (expenseData.liters !== undefined && expenseData.liters !== null && expenseData.liters !== '') {
        liters = Number(expenseData.liters);
        if (isNaN(liters) || liters <= 0) {
            return json({ success: false, message: 'Liters must be a positive number' }, { status: 400 });
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

        const updatedExpense = await prisma.expense.update({
            where: { id: Number(expenseData.id) },
            data: {
                date: expenseDate,
                description: expenseData.description.trim(),
                amount: amount,
                category: expenseData.category,
                mileage: mileage,
                liters: liters,
                subCategory: expenseData.subCategory || null
            }
        });

        return json({ success: true, expense: updatedExpense });

    } catch (error) {
        console.error(error);
        return json({ success: false, message: 'Database error' }, { status: 500 });
    }
}
