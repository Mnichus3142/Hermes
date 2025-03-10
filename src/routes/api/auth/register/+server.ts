import { json } from '@sveltejs/kit';
import { prepareDatabase } from '../../../../sql/prepareDatabase';
import type { RequestEvent } from './$types';

export async function POST(event: RequestEvent) {
    try {

        prepareDatabase();

        return json(
            {
                success: true,
                message: 'Registration process completed successfully, you can now log in'
            },
            { status: 201 }
        );
    }
    catch (error) {
        console.error('There was an error in POST /api/auth/register:', error);
        
        return json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}