import type { Handle } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const { cookies, url, route } = event;
    
    console.log('🔍 Hook wywołany dla:', url.pathname);

    // Ścieżki, które nie wymagają autentyfikacji
    const publicPaths = [
        '/',
        '/api/auth/login',
        '/api/auth/register', 
        '/api/auth/refresh',
        '/api/auth/logout',
        '/api/info/OAuth'
    ];
    
    // Sprawdź czy to ścieżka publiczna
    const isPublicPath = publicPaths.some(path => url.pathname === path || url.pathname.startsWith(path));
    
    console.log('📍 Ścieżka publiczna?', isPublicPath, 'dla', url.pathname);
      if (isPublicPath) {
        return resolve(event);
    }
    
    // Pobierz access token z cookies
    const accessToken = cookies.get('accessToken');
    
    console.log('🔑 Access token:', accessToken ? 'ISTNIEJE' : 'BRAK');
    
    if (!accessToken) {
        console.log('❌ Brak tokenu - przekierowuję na stronę logowania');
        // Brak tokenu - przekieruj do strony logowania z notyfikacją
        cookies.set('authNotification', JSON.stringify({
            title: 'Wymagane logowanie',
            message: 'Musisz się zalogować, aby uzyskać dostęp do tej strony',
            type: 'error',
            duration: 4000
        }), {
            path: '/',
            httpOnly: false,
            maxAge: 60
        });
        
        // Zapisz oryginalną ścieżkę do przekierowania po zalogowaniu
        if (url.pathname !== '/') {
            cookies.set('redirectAfterLogin', url.pathname + url.search, {
                path: '/',
                httpOnly: false,
                maxAge: 300 // 5 minut
            });
        }
          throw redirect(302, '/');
    }
    
    try {
        // Weryfikuj access token
        console.log('🔐 Weryfikuję access token...');
        const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as { id: number };
        
        console.log('✅ Token prawidłowy dla użytkownika ID:', payload.id);
        
        // Dodaj informacje o użytkowniku do event.locals
        event.locals.user = {
            id: payload.id
        };
        
        return resolve(event);
    } catch (error) {
        console.log('❌ Token nieprawidłowy:', error);
        // Token jest nieważny - usuń tokeny i przekieruj bez próby odświeżania
        cookies.delete('accessToken', { path: '/' });
        cookies.delete('refreshToken', { path: '/' });
        
        // Zapisz oryginalną ścieżkę do przekierowania po zalogowaniu
        if (url.pathname !== '/') {
            cookies.set('redirectAfterLogin', url.pathname + url.search, {
                path: '/',
                httpOnly: false,
                maxAge: 300 // 5 minut
            });
        }
        
        cookies.set('authNotification', JSON.stringify({
            title: 'Sesja wygasła',
            message: 'Twoja sesja wygasła. Zaloguj się ponownie',
            type: 'error', 
            duration: 4000
        }), {
            path: '/',
            httpOnly: false,
            maxAge: 60
        });
        
        console.log('🔄 Przekierowuję na stronę logowania...');
        throw redirect(302, '/');
    }
};