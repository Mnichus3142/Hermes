import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/functions/prisma";
import { json } from '@sveltejs/kit';

export async function POST (event: RequestEvent) {
    const userId = event.locals.user?.id;

    if (!userId) {
        return json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const cars = await prisma.car.findMany({
        where: { userId: userId }
    });

    return json({
        success: true,
        cars: cars
    });
}