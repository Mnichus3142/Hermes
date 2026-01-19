
import { type Handle, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import prisma from '$lib/functions/prisma';

export const handle: Handle = async ({ event, resolve }) => {
    const accessToken = event.cookies.get('accessToken');
    const refreshToken = event.cookies.get('refreshToken');

    let user: { id: number } | null = null;

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);
            if (typeof decoded === 'object' && 'id' in decoded) {
                user = { id: decoded.id };
            }
        } catch (err) {
        }
    }

    if (!user && refreshToken) {
        try {
            const decodedRefresh = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
            
            if (typeof decodedRefresh === 'object' && 'id' in decodedRefresh) {
                const tokenRecord = await prisma.refreshTokens.findUnique({
                    where: { token: refreshToken }
                });

                if (tokenRecord && tokenRecord.userId === decodedRefresh.id) {
                    
                    if (new Date() < tokenRecord.expiresAt) {
                        user = { id: tokenRecord.userId };

                        const newAccessToken = jwt.sign(
                            { id: user.id }, 
                            env.JWT_ACCESS_SECRET, 
                            { expiresIn: '15m' }
                        );

                        event.cookies.set('accessToken', newAccessToken, {
                            path: '/',
                            httpOnly: true,
                            secure: false, // Should be true in prod 'env.PROD'
                            maxAge: 60 * 15
                        });
                    }
                }
            }
        } catch (err) {
        }
    }

    if (user) {
        event.locals.user = user;
    }

    return resolve(event);
};
