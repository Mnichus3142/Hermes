<script lang="ts">
    import { clickOutside } from '$lib/functions/clickOutside';
    import { scale, fade } from 'svelte/transition';
    import { BodyPartEnum } from '$lib/enums/bodyPartEnum';
    import { ExpenseCategoryEnum } from '$lib/enums/expenseCategoryEnum';
    import type { ExpenseType, RepairItemType } from '$lib/types/expenseType';
    import { RepairItem } from '$lib/logic/repairItem';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';

    interface Props {
        carVin: string;
        onClose: () => void;
        onSuccess?: () => void;
        repairToEdit?: any;
    }

    let { carVin, onClose, onSuccess, repairToEdit }: Props = $props();

    let date = $state(new Date().toISOString().split('T')[0]);
    let description = $state('');
    let mileage = $state<number | undefined>(undefined);
    let items = $state<RepairItemType[]>([]);

    $effect(() => {
        if (repairToEdit) {
            date = new Date(repairToEdit.date).toISOString().split('T')[0];
            description = repairToEdit.description;
            mileage = repairToEdit.mileage;
            items = repairToEdit.repairItems ? [...repairToEdit.repairItems] : [];
        }
    });
    
    let newItemName = $state('');
    let newItemCost = $state<number>(0);
    let newItemBodyPart = $state<BodyPartEnum | undefined>(undefined);

    const totalCost = $derived(
        items.reduce((sum, item) => sum + Number(item.cost), 0)
    );

    function addItem() {
        if (!newItemName.trim()) {
            createNewNotification({
                title: 'Validation Error',
                message: 'Item name is required',
                type: 'error',
                duration: 3000
            });
            return;
        }
        
        // Creating an instance of the class as requested
        const repairItem = new RepairItem(newItemName, newItemCost, newItemBodyPart);
        items.push(repairItem.toJSON());
        
        // Reset inputs
        newItemName = '';
        newItemCost = 0;
        newItemBodyPart = undefined;
    }

    function removeItem(index: number) {
        items = items.filter((_, i) => i !== index);
    }

    async function handleSubmit() {
        if (items.length === 0) {
            createNewNotification({
                title: 'Validation Error',
                message: 'At least one item must be added to the repair',
                type: 'error',
                duration: 3000
            });
            return;
        }

        const expenseData: ExpenseType = {
            id: repairToEdit?.id,
            carVin,
            date,
            description,
            amount: totalCost,
            category: ExpenseCategoryEnum.REPAIR,
            mileage,
            repairItems: items
        };

        try {
            const url = repairToEdit ? '/api/expenses/update' : '/api/expenses/add';
            const method = repairToEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseData)
            });

            const result = await response.json();

            if (result.success) {
                createNewNotification({
                    title: 'Success',
                    message: repairToEdit ? 'Repair updated successfully' : 'Repair added successfully',
                    type: 'success',
                    duration: 3000
                });
                onSuccess?.();
                onClose();
            } else {
                createNewNotification({
                    title: 'Error',
                    message: result.message || `Failed to ${repairToEdit ? 'update' : 'add'} repair`,
                    type: 'error',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error(error);
            createNewNotification({
                title: 'Error',
                message: 'Internal server error',
                type: 'error',
                duration: 5000
            });
        }
    }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" transition:fade>
    <div 
        class="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6"
        use:clickOutside
        onclick_outside={onClose}
        transition:scale={{ duration: 200, start: 0.95 }}
    >
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-white">{repairToEdit ? 'Edit Repair' : 'Add New Repair'}</h2>
            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button onclick={onClose} class="text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1">
                    <label for="date" class="text-sm font-medium text-gray-400">Date</label>
                    <input type="date" id="date" bind:value={date} class="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div class="flex flex-col gap-1">
                    <label for="mileage" class="text-sm font-medium text-gray-400">Mileage (optional)</label>
                    <input type="number" id="mileage" bind:value={mileage} placeholder="Enter mileage" class="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>

            <div class="flex flex-col gap-1">
                <label for="description" class="text-sm font-medium text-gray-400">Description</label>
                <textarea id="description" bind:value={description} placeholder="Short description of the repair" class="bg-gray-800 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 resize-none"></textarea>
            </div>

            <div class="border-t border-gray-800 pt-4 mt-4">
                <h3 class="text-lg font-semibold text-white mb-3">Replaced Items</h3>
                
                <div class="grid grid-cols-12 gap-2 mb-4">
                    <div class="col-span-4 flex flex-col gap-1">
                        <input type="text" bind:value={newItemName} placeholder="Item name" class="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div class="col-span-2 flex flex-col gap-1">
                        <input type="number" bind:value={newItemCost} placeholder="Cost" class="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div class="col-span-4 flex flex-col gap-1">
                        <select bind:value={newItemBodyPart} class="bg-gray-800 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value={undefined}>No Body Part</option>
                            {#each Object.values(BodyPartEnum) as part}
                                <option value={part}>{part.replace(/_/g, ' ')}</option>
                            {/each}
                        </select>
                    </div>
                    <div class="col-span-2">
                        <button onclick={addItem} class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 text-sm font-medium transition-colors h-full">Add</button>
                    </div>
                </div>

                <div class="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {#each items as item, i}
                        <div class="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 group transition-all hover:bg-gray-800">
                            <div class="flex flex-col">
                                <span class="text-white font-medium">{item.name}</span>
                                {#if item.bodyPart}
                                    <span class="text-xs text-blue-400 uppercase tracking-wider">{item.bodyPart.replace(/_/g, ' ')}</span>
                                {/if}
                            </div>
                            <div class="flex items-center gap-4">
                                <span class="text-green-400 font-bold font-mono">{Number(item.cost).toFixed(2)} PLN</span>
                                <!-- svelte-ignore a11y_consider_explicit_label -->
                                <button onclick={() => removeItem(i)} class="text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>

        <div class="border-t border-gray-800 mt-6 pt-6 flex items-center justify-between">
            <div class="flex flex-col">
                <span class="text-sm text-gray-400">Total Repair Cost</span>
                <span class="text-2xl font-bold text-white font-mono">{totalCost.toFixed(2)} PLN</span>
            </div>
            <div class="flex gap-3">
                <button onclick={onClose} class="px-6 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all font-medium">Cancel</button>
                <button onclick={handleSubmit} class="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-all font-bold shadow-lg shadow-green-900/20">{repairToEdit ? 'Update Repair' : 'Save Repair'}</button>
            </div>
        </div>
    </div>
</div>

<style>
    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #374151;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #4b5563;
    }
</style>
