
import { type Handle, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import prisma from '$lib/functions/prisma';

export const handle: Handle = async ({ event, resolve }) => {
    const accessToken = event.cookies.get('accessToken');
    const refreshToken = event.cookies.get('refreshToken');

    let user: { id: number } | null = null;

    // 1. Try verify Access Token
    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, env.JWT_ACCESS_SECRET);
            if (typeof decoded === 'object' && 'id' in decoded) {
                user = { id: decoded.id };
            }
        } catch (err) {
            // Access token invalid or expired, ignore and try refresh token
        }
    }

    // 2. If no valid access token, try Refresh Token
    if (!user && refreshToken) {
        try {
            // Verify signature first to save DB call
            const decodedRefresh = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
            
            if (typeof decodedRefresh === 'object' && 'id' in decodedRefresh) {
                // Check DB
                const tokenRecord = await prisma.refreshTokens.findUnique({
                    where: { token: refreshToken }
                });

                if (tokenRecord && tokenRecord.userId === decodedRefresh.id) {
                    
                    // Check expiry (though jwt.verify checks date, DB has its own)
                    if (new Date() < tokenRecord.expiresAt) {
                        user = { id: tokenRecord.userId };

                        // RENEWAL: Issue new Access Token
                        const newAccessToken = jwt.sign(
                            { id: user.id }, 
                            env.JWT_ACCESS_SECRET, 
                            { expiresIn: '15m' }
                        );

                        event.cookies.set('accessToken', newAccessToken, {
                            path: '/',
                            httpOnly: true,
                            secure: false, // Should be true in prod 'env.PROD'
                            maxAge: 60 * 15 // 15 minutes
                        });
                    }
                }
            }
        } catch (err) {
            // Refresh token invalid
        }
    }

    if (user) {
        event.locals.user = user;
    }

    return resolve(event);
};
