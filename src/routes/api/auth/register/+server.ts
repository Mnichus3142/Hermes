import { json } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import bcrypt from 'bcrypt';
import type { RequestEvent } from './$types';

export async function POST(event: RequestEvent) {
    try {
        const { username, password } = await event.request.json();

        // --- Validation ---
        if (!username || typeof username !== 'string' || username.trim().length < 3) {
            return json(
                {
                    success: false,
                    title: 'Registration failed',
                    message: 'Username must be at least 3 characters long'
                },
                { status: 400 }
            );
        }

        if (!password || typeof password !== 'string' || password.length < 8) {
            return json(
                {
                    success: false,
                    title: 'Registration failed',
                    message: 'Password must be at least 8 characters long'
                },
                { status: 400 }
            );
        }

        const userExists = await prisma.users.findUnique({
            where: {
                username: username
            }
        });

        if (userExists) {
            return json(
                {
                    success: false,
                    title: 'Registration failed',
                    message: 'User already exists'
                },
                { status: 400 }
            );
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        await prisma.users.create({
            data: {
                username: username,
                password: encryptedPassword
            }
        });

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
        return json(
            {
                success: false,
                message: 'Internal server error',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }

    finally {
        await prisma.$disconnect();
    }
}