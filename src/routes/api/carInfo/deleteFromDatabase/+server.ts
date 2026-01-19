import type { RequestEvent } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import { json } from '@sveltejs/kit';

export async function DELETE (event: RequestEvent) {
    const { vin } = await event.request.json();
    const userId = event.locals.user?.id;

    if (!vin) {
         return json({
            success: false,
            title: 'Validation Error',
            message: 'VIN is required'
        }, { status: 400 });
    }

    try {
        if (!userId) {
            return json({
                success: false,
                title: 'Authorization Error',
                message: 'User not authenticated'
            }, { status: 401 });
        }

        // Verify car belongs to user
        const existingCar = await prisma.car.findUnique({
            where: {
                VIN: vin
            }
        });

        if (!existingCar || existingCar.userId !== userId) {
             return json({
                success: false,
                title: 'Operation Error',
                message: 'Car not found or you are not authorized to delete it'
            }, { status: 403 });
        }

        // Delete car
        await prisma.car.delete({
            where: {
                VIN: vin
            }
        });

        return json({
            success: true,
            title: 'Car Deleted',
            message: 'Vehicle deleted successfully'
        },
        { status: 200 }
    );
    } catch (error) {
        console.error(error);
            return json({
                success: false,
                title: 'Database Error',
                message: 'Failed to delete car from the database',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}