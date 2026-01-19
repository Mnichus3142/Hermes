import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import { json } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
    const { carVin } = await event.request.json();
    const userId = event.locals.user?.id;

    if (!userId) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const car = await prisma.car.findUnique({
            where: { VIN: carVin }
        });

        if (!car || car.userId !== userId) {
            return json({ success: false, message: 'Car not found or unauthorized' }, { status: 403 });
        }

        const expenses = await prisma.expense.findMany({
            where: { carVin: carVin },
            orderBy: { date: 'desc' }
        });

        return json({ success: true, expenses });

    } catch (error) {
        console.error(error);
        return json({ success: false, message: 'Database error' }, { status: 500 });
    }
}
