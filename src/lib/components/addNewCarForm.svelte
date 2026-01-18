<script lang="ts">
    import { clickOutside } from '$lib/functions/clickOutside';
    import { scale, fade } from 'svelte/transition';
    import ConfirmationDialog from './ConfirmationDialog.svelte';

    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();
    let showConfirm = $state(false);

    function handleCloseAttempt() {
        showConfirm = true;
    }

    function confirmClose() {
        showConfirm = false;
        onClose();
    }

    function cancelClose() {
        showConfirm = false;
    }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" transition:fade={{ duration: 200 }}>
    <div 
        use:clickOutside
        onclick_outside={handleCloseAttempt}
        class="bg-mainBackground border border-mainBorder w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative"
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <!-- Header -->
        <div class="p-6 border-b border-mainBorder flex justify-between items-center">
            <h2 class="text-2xl font-bold text-mainAccent font-title">Add New Vehicle</h2>
            <button 
                onclick={handleCloseAttempt}
                class="text-mainTextColor/50 hover:text-mainAccent transition-colors text-2xl"
            >
                &times;
            </button>
        </div>

        <!-- Body -->
        <div class="p-8 max-h-[80vh] overflow-y-auto">
            <form class="space-y-6">
                <!-- Form fields would go here -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col gap-2">
                        <label for="make" class="text-sm font-medium text-mainTextColor/70">Manufacturer</label>
                        <input type="text" id="make" class="bg-dashboardBackground border border-mainBorder rounded-lg p-2 text-mainTextColor focus:border-mainAccent outline-none" placeholder="e.g. BMW" />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label for="model" class="text-sm font-medium text-mainTextColor/70">Model</label>
                        <input type="text" id="model" class="bg-dashboardBackground border border-mainBorder rounded-lg p-2 text-mainTextColor focus:border-mainAccent outline-none" placeholder="e.g. M3" />
                    </div>
                </div>
                
                <div class="flex justify-end mt-8">
                    <button type="submit" class="buttonPrimary w-auto px-8">
                        Save Vehicle
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

{#if showConfirm}
    <ConfirmationDialog 
        title="Discard changes?"
        message="Are you sure you want to close? Any unsaved data will be lost."
        confirmText="Yes, discard"
        cancelText="No, stay"
        onConfirm={confirmClose}
        onCancel={cancelClose}
    />
{/if}
