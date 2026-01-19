import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import { json } from '@sveltejs/kit';

export async function DELETE(event: RequestEvent) {
    const { id, carVin } = await event.request.json();
    const userId = event.locals.user?.id;

    if (!userId) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // --- Validation ---
    if (!id || isNaN(Number(id))) {
        return json({ success: false, message: 'Invalid expense ID' }, { status: 400 });
    }

    if (!carVin || carVin.length !== 17) {
        return json({ success: false, message: 'Invalid VIN number' }, { status: 400 });
    }

    try {
        // Verify car ownership
        const car = await prisma.car.findUnique({
            where: { VIN: carVin }
        });

        if (!car || car.userId !== userId) {
            return json({ success: false, message: 'Car not found or unauthorized' }, { status: 403 });
        }

        await prisma.expense.delete({
            where: { id: Number(id) }
        });

        return json({ success: true });

    } catch (error) {
        console.error(error);
        return json({ success: false, message: 'Database error' }, { status: 500 });
    }
}
