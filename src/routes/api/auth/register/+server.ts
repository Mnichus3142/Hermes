import { json } from '@sveltejs/kit';
import sql from '$lib/functions/db';
import crypto from 'crypto';
import type { RequestEvent } from './$types';

export async function POST(event: RequestEvent) {
    try {
        // Get the username and password from user
        const { username, password } = await event.request.json();

        // Check if the user already exists in database
        const userExists = await sql`SELECT * FROM users WHERE username = ${username}`;
        if (userExists.length !== 0) {
            return json(
                {
                    success: false,
                    title: 'Registration failed',
                    message: 'User already exists'
                },
                { status: 400 }
            );
        }

        // Encrypt password
        const encryptedPassword = await crypto.createHash('sha256').update(password).digest('hex');

        // Insert the user into the database
        await sql`INSERT INTO users (username, password) VALUES (${username}, ${encryptedPassword})`;

        return json(
            {
                success: true,
                title: 'Registration completed',
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