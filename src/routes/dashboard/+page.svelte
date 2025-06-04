<!-- Przykładowa chroniona strona -->
<script lang="ts">
    import type { PageData } from './$types';
    
    interface UserPageData {
        user?: {
            id: number;
        }
    }
    
    let { data }: { data: UserPageData } = $props();
</script>

<div class="min-h-screen bg-main-100 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-main-800 mb-6">Dashboard</h1>
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-main-700 mb-4">Witaj w chronionym obszarze!</h2>
            <p class="text-main-600 mb-4">
                Jesteś zalogowany jako użytkownik ID: <span class="font-mono bg-gray-100 px-2 py-1 rounded">{data.user?.id || 'nieznany'}</span>
            </p>
            <p class="text-main-600 mb-6">
                Ta strona jest dostępna tylko dla zalogowanych użytkowników.
            </p>
              <div class="border-t pt-4">
                <div class="flex gap-4">
                    <a 
                        href="/profile" 
                        class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Profil użytkownika
                    </a>
                    <a 
                        href="/api/auth/logout" 
                        class="inline-block bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Wyloguj się
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
