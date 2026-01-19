import type { RequestEvent } from '@sveltejs/kit';
import type { CarType } from '$lib/types/carType';
import prisma from '$lib/functions/prisma';
import { checkCar } from '$lib/functions/checkCarCreationConditions';

export async function POST (event: RequestEvent) {
    const carData: CarType = await event.request.json();

    // Validate car data
    const validation = checkCar(carData);
    if (!validation.valid) {
        return new Response(
            JSON.stringify({
                success: false,
                title: 'Validation Error',
                message: `Cannot add vehicle: ${validation.errors[0]}`
            }),
            { status: 400 }
        );
    }
}