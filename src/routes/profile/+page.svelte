<!-- Przykładowa chroniona strona profilu -->
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
        <div class="mb-6">
            <a 
                href="/dashboard" 
                class="text-blue-500 hover:text-blue-600 transition-colors"
            >
                ← Powrót do dashboard
            </a>
        </div>
        
        <h1 class="text-3xl font-bold text-main-800 mb-6">Profil użytkownika</h1>
        
        <div class="bg-white rounded-lg shadow-md p-6">
            <h2 class="text-xl font-semibold text-main-700 mb-4">Informacje o koncie</h2>
              <div class="space-y-4">
                <div>
                    <div class="block text-sm font-medium text-main-600 mb-1">ID użytkownika:</div>
                    <div class="font-mono bg-gray-100 px-3 py-2 rounded border">
                        {data.user?.id || 'nieznany'}
                    </div>
                </div>
                
                <div>
                    <div class="block text-sm font-medium text-main-600 mb-1">Status:</div>
                    <div class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Zalogowany
                    </div>
                </div>
            </div>
            
            <div class="mt-6 pt-6 border-t">
                <div class="flex gap-4">
                    <a 
                        href="/dashboard" 
                        class="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                        Dashboard
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
