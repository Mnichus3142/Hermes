<script lang="ts">
    import { fade } from 'svelte/transition';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    import ConfirmationDialog from './ConfirmationDialog.svelte';
  import type { repairExpense } from '$lib/logic/repairExpense';
  import AddRepairPopup from './AddRepairPopup.svelte';

    let { carInfo, expenseTracker } = $props();

    let repairExpenses = $state<repairExpense[]>([]);
    let showDeleteRepairConfirm = $state(false);
    let repairIdToDelete = $state<number|null>(null);
    let repairSum = $state(0);
    let loadingRepairs = $state(false);
    let showRepairPopup = $state(false);
    let repairToEdit = $state<repairExpense|null>(null);
    let selectedRepair = $state<repairExpense|null>(null);

    $effect(() => {
        if (carInfo?.VIN) {
            fetchRepairData();
        }
    });

    const fetchRepairData = async () => {
        loadingRepairs = true;
        await expenseTracker.loadExpenses(carInfo.VIN);
        repairExpenses = expenseTracker.repairs;
        repairSum = await expenseTracker.calculateTotalRepairExpenses();
        loadingRepairs = false;
    }

    const handleStartEditRepair = (repair: repairExpense) => {
        if (!repair.id) return;
        repairToEdit = repair;
        showRepairPopup = true;
    }

    const handleDeleteRepair = async () => {
        if (!repairIdToDelete) return;
        
        loadingRepairs = true;
        const success = await expenseTracker.deleteRepairExpense(carInfo.VIN, repairIdToDelete);
        
        if (success) {
             await fetchRepairData();
             createNewNotification({ type: 'success', title: 'Deleted', message: 'Repair record deleted', duration: 3000 });
        } else {
             createNewNotification({ type: 'error', title: 'Error', message: 'Failed to delete', duration: 3000 });
        }
        showDeleteRepairConfirm = false;
        repairIdToDelete = null;
        loadingRepairs = false;
    }
</script>

<div class="h-full flex flex-col gap-6" in:fade={{ duration: 200 }}>
    <!-- ACTION BAR -->
    <div class="flex justify-between items-center bg-mainBackground/50 backdrop-blur-sm p-4 rounded-xl border border-mainBorder shadow-lg">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-mainAccent/10 flex items-center justify-center text-mainAccent text-xl">🔧</div>
            <div>
                <h3 class="text-lg font-bold text-mainAccent">Maintenance & Repairs</h3>
                <p class="text-sm text-mainTextColor opacity-50">Log and track vehicle service history</p>
            </div>
        </div>
        <button 
            onclick={() => showRepairPopup = true}
            class="bg-mainAccent hover:bg-mainAccent/80 text-white font-bold py-2 px-6 rounded-lg transition-all active:scale-95 shadow-lg flex items-center gap-2"
        >
            <span>+</span> Add New Repair
        </button>
    </div>

    <!-- REPAIR LIST -->
    <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg overflow-auto flex-1">
        <h3 class="text-lg font-bold text-mainAccent mb-6 flex justify-between items-center border-b border-white/5 pb-4">
            <span>Service History</span>
            <div class="flex flex-col items-end">
                <span class="text-xs text-mainTextColor opacity-50 uppercase">Total Spent</span>
                <span class="text-xl font-mono text-white">{repairSum.toFixed(2)} PLN</span>
            </div>
        </h3>

        {#if loadingRepairs && repairExpenses.length === 0}
            <div class="text-center opacity-50 py-10">Loading repairs...</div>
        {:else if repairExpenses.length === 0}
                <div class="text-center opacity-50 py-20 flex flex-col items-center gap-4">
                <div class="text-4xl opacity-20 italic">No records yet</div>
                <button onclick={() => showRepairPopup = true} class="text-mainAccent hover:underline">Click here to log your first repair</button>
                </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {#each repairExpenses as repair}
                    <div class="bg-black/20 border border-white/5 rounded-xl p-4 group hover:border-mainAccent/30 transition-all">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex gap-3">
                                <div class="w-10 h-10 rounded-lg bg-mainAccent/10 flex items-center justify-center text-mainAccent text-xl">
                                    🔧
                                </div>
                                <div>
                                    <div class="font-bold text-white leading-tight">{repair.description}</div>
                                    <div class="text-xs opacity-50 mt-1">{new Date(repair.date).toLocaleDateString()} {repair.mileage ? `• ${repair.mileage} km` : ''}</div>
                                </div>
                            </div>
                            <div class="font-bold text-mainAccent font-mono">{repair.cost.toFixed(2)}</div>
                        </div>
                        
                        <div class="flex justify-between items-center mt-4 pt-3 border-t border-white/5">
                            <span class="text-xs bg-mainAccent/10 text-mainAccent px-2 py-1 rounded-md font-bold uppercase tracking-wider">{repair.subCategory}</span>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onclick={() => selectedRepair = repair} class="p-1.5 hover:bg-white/5 rounded-md text-mainTextColor/50 hover:text-white transition-colors">
                                    👁️
                                </button>
                                <button onclick={() => { repairIdToDelete = repair.id || null; showDeleteRepairConfirm = true; }} class="p-1.5 hover:bg-white/5 rounded-md text-mainTextColor/50 hover:text-red-400 transition-colors">
                                    ✖
                                </button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if showRepairPopup}
    <AddRepairPopup 
        carVin={carInfo.VIN} 
        repairToEdit={repairToEdit}
        onClose={() => {
            showRepairPopup = false;
            repairToEdit = null;
        }}
        onSuccess={() => {
            fetchRepairData();
            repairToEdit = null;
        }}
    />
{/if}

{#if showDeleteRepairConfirm}
    <ConfirmationDialog
        title="Delete Repair Record?"
        message="Are you sure you want to delete this maintenance record?"
        confirmText="Yes, delete"
        cancelText="No, cancel"
        onConfirm={handleDeleteRepair}
        onCancel={() => { showDeleteRepairConfirm = false; repairIdToDelete = null; }}
    />
{/if}

<!-- Repair Detail View should probably be its own component too -->
{#if selectedRepair}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
        transition:fade={{ duration: 150 }}
        onclick={() => selectedRepair = null}
        role="dialog"
        tabindex="-1"
    >
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div 
            class="bg-mainBackground border border-mainBorder rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative" 
            onclick={(e) => e.stopPropagation()} 
            role="document" 
            tabindex="0"
        >
             <!-- Header -->
             <div class="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div>
                     <div class="text-sm font-bold opacity-50 mb-1 uppercase tracking-widest text-mainAccent">Repair Details</div>
                     <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                        <span>{selectedRepair.subCategory || 'Repair'}</span>
                        <span class="text-lg opacity-50 font-normal">| {new Date(selectedRepair.date).toLocaleDateString()}</span>
                     </h2>
                </div>
                <button class="bg-white/5 hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-colors" onclick={() => selectedRepair = null}>✖</button>
             </div>

            <div class="p-8 bg-mainBackground space-y-8">
                    <div class="bg-linear-to-br from-mainAccent/20 to-blue-900/20 p-6 rounded-2xl border border-mainAccent/20 flex justify-between items-center">
                        <div>
                            <div class="text-xs font-bold text-mainAccent opacity-80 uppercase tracking-widest mb-1">Total Cost</div>
                            <div class="text-4xl font-mono text-white font-bold">{selectedRepair.cost.toFixed(2)}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs opacity-50 mb-1 uppercase tracking-wide">Mileage</div>
                            <div class="font-bold text-lg font-mono">{selectedRepair.mileage ? `${selectedRepair.mileage} km` : 'N/A'}</div>
                        </div>
                    </div>

                    <div>
                        <div class="text-sm font-bold opacity-50 uppercase tracking-widest mb-3">Technician Notes</div>
                        <div class="bg-white/5 p-6 rounded-xl border border-white/5 text-sm leading-7 text-gray-300 whitespace-pre-wrap font-mono">
                            {selectedRepair.description}
                        </div>
                    </div>

                    {#if selectedRepair.repairItems && selectedRepair.repairItems.length > 0}
                        <div>
                            <div class="text-sm font-bold opacity-50 uppercase tracking-widest mb-3">Replaced Items</div>
                            <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {#each selectedRepair.repairItems as item}
                                    <div class="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                                        <div>
                                            <div class="font-medium text-white">{item.name}</div>
                                            {#if item.bodyPart}
                                                <div class="text-[10px] text-mainAccent font-bold uppercase tracking-wider">{item.bodyPart.replace(/_/g, ' ')}</div>
                                            {/if}
                                        </div>
                                        <div class="font-mono text-white">{item.cost.toFixed(2)} PLN</div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/if}

                    <div class="flex gap-3 pt-4 cursor-default border-t border-white/5">
                    <button 
                        class="flex-1 py-3 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-600/20 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 group"
                        onclick={() => { 
                            if (selectedRepair) handleStartEditRepair(selectedRepair); 
                            selectedRepair = null; 
                        }}
                    >
                        <span>Edit Record</span>
                    </button>
                    </div>
            </div>
        </div>
    </div>
{/if}
