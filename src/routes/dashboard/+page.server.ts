import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import prisma from '$lib/functions/prisma';

export const load: PageServerLoad = async ({ locals, cookies }) => {
    if (!locals.user) {
        throw redirect(303, '/');
    }
    
    const user = await prisma.users.findUnique({
        where: { id: locals.user?.id },
        select: { id: true, username: true }
    })

    if (!user) {
        cookies.delete('accessToken', { path: '/' });
        cookies.delete('refreshToken', { path: '/' });
        throw redirect(303, '/');
    }

    return { 
        user
    };
};
