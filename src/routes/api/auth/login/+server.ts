import {json} from "@sveltejs/kit";
import prisma from '$lib/functions/prisma';
// import 'erronaut';
import bcrypt from 'bcrypt';
import type { RequestEvent } from './$types';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export async function POST(event: RequestEvent) {
    try {
        const { cookies } = event;
        const { username, password } = await event.request.json();

        const userExists = await prisma.users.findUnique({
            where: {
                username : username,
            }
        })

        if (!userExists) {
            return json(
                {
                    success: false,
                    title: 'Invalid username and/or password',
                    message: 'Invalid username and/or password',
                },
                { status: 401 }
            );
        }

        const match = await bcrypt.compare(password, userExists.password)

        if (!match) {
            return json(
                {
                    success: false,
                    title: 'Invalid username and/or password',
                    message: 'Invalid username and/or password',
                },
                { status: 401 }
            );
        }

        const accessToken = jwt.sign({ id: userExists.id }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        let refreshToken;
        let updateDatabase = false;
        
        // Check if refresh token already exists
        const existingRefreshToken = await prisma.refreshTokens.findFirst({
            where: {
                userId: userExists.id
            }
        });
        
        // Check if the existing refresh token is still valid
        if (existingRefreshToken) {

            let isValid = false;
            try {
                jwt.verify(existingRefreshToken.token, env.JWT_REFRESH_SECRET);
                isValid = true;
            } 
            catch (error) {
                isValid = false;
            }

            if (isValid) {
                // If valid, use the existing refresh token
                refreshToken = existingRefreshToken.token;

                updateDatabase = true;
            } 
            
            else {
                // If not valid, delete it
                await prisma.refreshTokens.delete({
                    where: {
                        id: existingRefreshToken.id
                    }
                });

                refreshToken = jwt.sign({ id: userExists.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 7);

                const updateDatabaseQuery = await prisma.refreshTokens.create({
                    data: {
                        userId: Number(userExists.id),
                        token: String(refreshToken),
                        expiresAt
                    }
                });

                if (updateDatabaseQuery) {
                    updateDatabase = true;
                }
            }
        }


        else {
            refreshToken = jwt.sign({ id: userExists.id }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            const updateDatabaseQuery = await prisma.refreshTokens.create({
                data: {
                    userId: Number(userExists.id),
                    token: String(refreshToken),
                    expiresAt
                }
            });

            if (updateDatabaseQuery) {
                updateDatabase = true;
            }
        }

        if (updateDatabase) {
            cookies.set(
                'accessToken',
                accessToken,
                {
                    path: '/',
                    httpOnly: true,
                    secure: false,
                    maxAge: 60 * 15,
                }
            )

            cookies.set(
                'refreshToken',
                refreshToken,
                {
                    path: '/',
                    httpOnly: true,
                    secure: false,
                    maxAge: 60 * 60 * 24 * 7,
                }
            )
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