import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import { json } from '@sveltejs/kit';
import type { ExpenseType } from '$lib/types/expenseType';

export async function POST(event: RequestEvent) {
    const expenseData: ExpenseType = await event.request.json();
    const userId = event.locals.user?.id;

    if (!userId) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
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
                date: new Date(expenseData.date),
                description: expenseData.description,
                amount: Number(expenseData.amount),
                category: expenseData.category,
                mileage: expenseData.mileage ? Number(expenseData.mileage) : null,
                liters: expenseData.liters ? Number(expenseData.liters) : null
            }
        });

        if (expenseData.mileage && expenseData.mileage > car.mileage) {
            await prisma.car.update({
                where: { VIN: expenseData.carVin },
                data: { mileage: Number(expenseData.mileage) }
            });
        }

        return json({ success: true, expense: newExpense });

    } catch (error) {
        console.error(error);
        return json({ success: false, message: 'Database error' }, { status: 500 });
    }
}
