import { json } from '@sveltejs/kit';
import prisma from '$lib/functions/prisma';
import type { RequestEvent } from './$types';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

export async function POST(event: RequestEvent) {
    try {
        const { cookies } = event;

        const refreshToken = cookies.get('refreshToken');
        
        const tokenExists = await prisma.refreshTokens.findUnique({
            where: {
                token: refreshToken
            }
        });


        if (!refreshToken || !tokenExists) {
            return json(
                {
                    success: false,
                    title: 'Unauthorized',
                    message: 'No refresh token provided'
                },
                { status: 401 }
            );
        }

        const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { id: number };

        if (payload.id !== tokenExists.userId) {
            return json(
                {
                    success: false,
                    title: 'Unauthorized',
                    message: 'Invalid refresh token'
                },
                { status: 401 }
            );
        }    

        const currentDate = new Date();
        const expirationDate = new Date(tokenExists.expiresAt);
        const timeDifference = expirationDate.getTime() - currentDate.getTime();
        const hoursUntilExpiration = timeDifference / (1000 * 60 * 60);
        const isExpiringWithin24Hours = hoursUntilExpiration < 24 && hoursUntilExpiration > 0;
        
        if (isExpiringWithin24Hours) {
            const newExpirationDate = new Date();
            newExpirationDate.setDate(newExpirationDate.getDate() + 7);

            await prisma.refreshTokens.update({
                where: {
                    token: refreshToken
                },
                data: {
                    expiresAt: newExpirationDate
                }
            });

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
        
        const accessToken = jwt.sign({ id: tokenExists.userId }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

        cookies.set(
            'accessToken',
            accessToken,
            {
                path: '/',
                httpOnly: true,
                secure: false,
                maxAge: 60 * 15,
            }
        );

        return json({
            success: true,
            title: 'Token refreshed',
            message: 'Access token has been refreshed successfully'
        });
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