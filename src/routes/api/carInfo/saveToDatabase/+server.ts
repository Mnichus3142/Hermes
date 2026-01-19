import type { RequestEvent } from '@sveltejs/kit';
import type { CarType } from '$lib/types/carType';
import prisma from '$lib/functions/prisma';
import { checkCar } from '$lib/functions/checkCarCreationConditions';
import { json } from '@sveltejs/kit';

export async function POST (event: RequestEvent) {
    const carData: CarType = await event.request.json();
    const userId = event.locals.user?.id;

    // Validate car data
    const validation = checkCar(carData);
    if (!validation.valid) {
        return json({
            success: false,
            title: 'Validation Error',
            message: 'Invalid car data',
            errors: validation.errors
        },
        { status: 400 }
    );
    }

    try {
        if (!userId) {
            return json({
                success: false,
                title: 'Authorization Error',
                message: 'User not authenticated'
            }, { status: 401 });
        }

        // Date fields validation
        if (!carData.insuranceValidUntil) {
            return json({
                success: false,
                title: 'Validation Error',
                message: 'Insurance valid until date is required'
            }, { status: 400 });
        }
        
        if (!carData.technicalInspectionValidUntil) {
            return json({
                success: false,
                title: 'Validation Error',
                message: 'Technical inspection valid until date is required'
            }, { status: 400 });
        }

        console.log('Otrzymane dane:', carData);
        console.log('ID użytkownika z locals:', userId);

        // Save car data to the database
        await prisma.car.create({
            data: {
                VIN: carData.VIN,
                type: carData.type,
                manufacturer: carData.manufacturer,
                model: carData.model,
                year: Number(carData.year),
                mileage: Number(carData.mileage),
                licensePlate: carData.licensePlate,
                insuranceValidUntil: carData.insuranceValidUntil ? new Date(carData.insuranceValidUntil) : null,
                technicalInspectionValidUntil: carData.technicalInspectionValidUntil ? new Date(carData.technicalInspectionValidUntil) : null,
                userId: userId
            }
        });
        return json({
            success: true,
            title: 'Car Added',
            message: 'Vehicle added to the database successfully'
        },
        { status: 201 }
    );
    } catch (error) {
            return json({
                success: false,
                title: 'Database Error',
                message: 'Failed to save car data to the database',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}