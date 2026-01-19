import type { RequestEvent } from '@sveltejs/kit';
import type { CarType } from '$lib/types/carType';
import prisma from '$lib/functions/prisma';
import { checkCar } from '$lib/functions/checkCarCreationConditions';
import { json } from '@sveltejs/kit';

export async function PUT (event: RequestEvent) {
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

        // --- Date Validation ---
        const insuranceDate = carData.insuranceValidUntil ? new Date(carData.insuranceValidUntil) : null;
        const inspectionDate = carData.technicalInspectionValidUntil ? new Date(carData.technicalInspectionValidUntil) : null;

        if (!insuranceDate || isNaN(insuranceDate.getTime())) {
            return json({
                success: false,
                title: 'Validation Error',
                message: 'A valid insurance expiration date is required'
            }, { status: 400 });
        }
        
        if (!inspectionDate || isNaN(inspectionDate.getTime())) {
            return json({
                success: false,
                title: 'Validation Error',
                message: 'A valid technical inspection date is required'
            }, { status: 400 });
        }

        // Verify car belongs to user
        const existingCar = await prisma.car.findUnique({
            where: {
                VIN: carData.VIN
            }
        });

        if (!existingCar || existingCar.userId !== userId) {
             return json({
                success: false,
                title: 'Operation Error',
                message: 'Car not found or you are not authorized to edit it'
            }, { status: 403 });
        }

        // Update car data in the database
        await prisma.car.update({
            where: {
                VIN: carData.VIN
            },
            data: {
                type: carData.type,
                manufacturer: carData.manufacturer,
                model: carData.model,
                year: Number(carData.year),
                mileage: Number(carData.mileage),
                licensePlate: carData.licensePlate,
                insuranceValidUntil: insuranceDate,
                technicalInspectionValidUntil: inspectionDate,
                engineCapacity: carData.engineCapacity ? Number(carData.engineCapacity) : null,
                fuelType: carData.fuelType || null,
                power: carData.power ? Number(carData.power) : null,
                torque: carData.torque ? Number(carData.torque) : null,
                transmissionType: carData.transmissionType || null,
                gears: carData.gears ? Number(carData.gears) : null,
            }
        });

        return json({
            success: true,
            title: 'Car Updated',
            message: 'Vehicle information updated successfully'
        },
        { status: 200 }
    );
    } catch (error) {
        console.error(error);
            return json({
                success: false,
                title: 'Database Error',
                message: 'Failed to update car data in the database',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}