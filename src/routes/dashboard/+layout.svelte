<script lang="ts">
    import { page } from '$app/stores';
</script>

<div class="h-screen w-full flex flex-col">
    <header class="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
        <h1 class="text-xl font-bold">Dashboard</h1>
        <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">User ID: {$page.data.user?.id}</span>
            <form action="/api/auth/logout" method="GET">
                <button 
                    type="submit" 
                    class="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                    Wyloguj
                </button>
            </form>
        </div>
    </header>

    <main class="flex-1 overflow-auto bg-gray-50 p-6">
        <slot />
    </main>
</div>
