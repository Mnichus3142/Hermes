import {json} from "@sveltejs/kit";
import prisma from '$lib/functions/prisma';
import crypto from 'crypto';
import 'erronaut';
import bcrypt from 'bcrypt';
import type { RequestEvent } from './$types';
import {webcrypto} from "node:crypto";

export async function POST(event: RequestEvent) {
    try {
        const { username, password } = await event.request.json();

        const userExists = await prisma.users.findUnique({
            where: {
                username : username,
            }
        })

        const match = await bcrypt.compare(password, userExists.password)

        if (!match) {
            return json(
                {
                    success: false,
                    title: 'Invalid password',
                    message: 'That is not a valid password',
                },
                { status: 401 }
            );
        }

        return json(
            {
                success: true,
                title: 'Successfully logged in',
                message: 'You are logged in, you will be redirected to main page in a few seconds'
            },
            { status: 201 }
        );
    }

    catch (error) {
        return json({
                success: false,
                message: 'Could not log in',
                error: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 }
        )
    }

    finally {
        prisma.$disconnect();
    }
}