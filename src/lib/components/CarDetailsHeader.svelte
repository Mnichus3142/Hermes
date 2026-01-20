<script lang="ts">
    import { carStore } from '$lib/logic/carStore.svelte';
    
    let { carInfo, onClose, toggleEditForm, showDeleteConfirm = $bindable() } = $props();
</script>

<div class="p-6 flex justify-between items-center">
    <div>
        <div 
            class="flex items-center gap-2 cursor-pointer text-mainTextColor opacity-70 hover:opacity-100 transition-all mb-2 hover:scale-110"
            onclick={onClose}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && onClose()}
        >
            <div class="text-xl relative -top-px">←</div> 
            <span class="text-sm font-semibold">Back to Garage</span>
        </div>

        <h2 class="text-3xl font-bold mb-1 gradientText">
            {carInfo.manufacturer} {carInfo.model}
        </h2>
        <span class="text-sm text-mainTextColor font-google-sans opacity-70 tracking-wider">
            {carInfo.licensePlate || 'NO PLATE'}
        </span>
    </div>
    
    <div class="flex gap-2">
        <button 
            onclick={toggleEditForm}
            class="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-all font-semibold flex items-center gap-2 cursor-pointer hover:scale-110 shadow-2xl"
        >
            Edit Details
            <svg width="46" height="46" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 stroke-blue-400">
                <path d="M3 21h4L20 8a2.829 2.829 0 0 0-4-4L3 17v4Z"></path>
                <path d="m14.5 5.5 4 4"></path>
                <path d="M12 8 7 3 3 7l5 5"></path>
                <path d="M7 8 5.5 9.5"></path>
                <path d="m16 12 5 5-4 4-5-5"></path>
                <path d="m16 17-1.5 1.5"></path>
            </svg>
        </button>
        <button 
            onclick={() => showDeleteConfirm = true}
            class="px-4 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-all font-semibold flex items-center gap-2 cursor-pointer hover:scale-110 shadow-2xl"
        >
            Delete
            <svg width="46" height="46" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 stroke-red-400">
                <path d="M4 7h16"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
                <path d="m5 7 1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12"></path>
                <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path>
            </svg>
        </button>
    </div>
</div>
