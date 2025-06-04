import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    // Dodatkowa weryfikacja - jeśli hooks nie przekierowały, to zrób to tutaj
    if (!locals.user) {
        console.log('🚨 Dashboard: Brak użytkownika w locals - przekierowuję');
        throw redirect(302, '/');
    }
    
    console.log('✅ Dashboard: Użytkownik znaleziony:', locals.user.id);
    
    return {
        user: locals.user
    };
};
