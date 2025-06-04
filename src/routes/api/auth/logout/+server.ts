import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import prisma from '$lib/functions/prisma';

export async function GET(event: RequestEvent) {
    const { cookies } = event;
    
    try {
        const refreshToken = cookies.get('refreshToken');
        
        if (refreshToken) {
            await prisma.refreshTokens.deleteMany({
                where: {
                    token: refreshToken
                }
            });
        }
        
        cookies.delete('accessToken', { path: '/' });
        cookies.delete('refreshToken', { path: '/' });
        
        cookies.set('authNotification', JSON.stringify({
            title: 'Wylogowano pomyślnie',
            message: 'Zostałeś wylogowany z systemu',
            type: 'success',
            duration: 3000
        }), {
            path: '/',
            httpOnly: false,
            maxAge: 60
        });
        
    } catch (error) {
        console.error('Error during logout:', error);
        
        cookies.delete('accessToken', { path: '/' });
        cookies.delete('refreshToken', { path: '/' });
        
        cookies.set('authNotification', JSON.stringify({
            title: 'Wystąpił błąd',
            message: 'Wystąpił błąd podczas wylogowania, ale zostałeś wylogowany lokalnie',
            type: 'error',
            duration: 4000
        }), {
            path: '/',
            httpOnly: false,
            maxAge: 60
        });
    } finally {
        await prisma.$disconnect();
    }
    
    throw redirect(302, '/');
}
