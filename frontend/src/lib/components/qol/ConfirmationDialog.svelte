<script lang="ts">
    import { fade } from "svelte/transition";

    interface Props {
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm: () => void;
        onCancel: () => void;
    }

    const { 
        title = 'Discard changes?', 
        message = 'Are you sure you want to do this?', 
        confirmText = 'Yes', 
        cancelText = 'No',
        onConfirm,
        onCancel
    }: Props = $props();
</script>

<div class="fixed inset-0 z-200 flex items-center justify-center bg-black/50" transition:fade={{ duration: 100 }}>
    <div class="bg-mainBackground border border-mainBorder p-6 rounded-xl shadow-2xl max-w-sm w-full mx-4">
        <h2 class="text-xl font-bold text-mainAccent mb-2">{title}</h2>
        <p class="text-mainTextColor mb-6">{message}</p>
        
        <div class="flex justify-end gap-3">
            <button 
                type="button"
                onclick={onCancel}
                class="px-4 py-2 text-sm font-medium text-mainTextColor hover:bg-white/10 rounded-md transition-all cursor-pointer hover:scale-110 duration-200"
            >
                {cancelText}
            </button>
            <button 
                type="button"
                onclick={onConfirm}
                class="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-all cursor-pointer hover:scale-110 duration-200"
            >
                {confirmText}
            </button>
        </div>
    </div>
</div>
