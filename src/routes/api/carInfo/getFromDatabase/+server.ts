import type { RequestEvent } from "@sveltejs/kit";
import prisma from "$lib/functions/prisma";
import { json } from '@sveltejs/kit';

export async function POST (event: RequestEvent) {
    const cars = await prisma.car.findMany({
        where: { userId: event.locals.user?.id }
    });

    return json({
        success: true,
        cars: cars
    });
}