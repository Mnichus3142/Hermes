<script lang="ts">
    import { fade } from 'svelte/transition';
    import { ExpenseTracker } from '$lib/logic/expenseTracker';
    import { carStore } from '$lib/logic/carStore.svelte';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    import type { fuelExpense } from '$lib/logic/fuelExpense';
    import ConfirmationDialog from './ConfirmationDialog.svelte';

    let { carInfo, expenseTracker } = $props();

    let fuelExpenses = $state<fuelExpense[]>([]);
    let editingExpenseId = $state<number|null>(null);
    let showDeleteFuelConfirm = $state(false);
    let fuelIdToDelete = $state<number|null>(null);
    let consumptionSum = $state(0);
    
    let fuelForm = $state({
        date: new Date().toISOString().split('T')[0],
        liters: 0,
        price: 0,
        mileage: undefined as number | undefined
    });
    let loadingFuel = $state(false);

    $effect(() => {
        if (carInfo?.VIN) {
            fetchFuelData();
        }
    });

    const fetchFuelData = async () => {
        loadingFuel = true;
        await expenseTracker.loadExpenses(carInfo.VIN);
        fuelExpenses = expenseTracker.expenses;
        consumptionSum = await expenseTracker.calculateTotalFuelExpenses();
        loadingFuel = false;
    }

    const resetFuelForm = () => {
        fuelForm = {
            date: new Date().toISOString().split('T')[0],
            liters: 0,
            price: 0,
            mileage: undefined
        };
        editingExpenseId = null;
    }

    const handleStartEdit = (expense: fuelExpense) => {
        if (!expense.id) return;
        editingExpenseId = expense.id;
        fuelForm = {
            date: expense.date.toISOString().split('T')[0],
            liters: expense.liters,
            price: expense.pricePerLiter,
            mileage: undefined
        };
    }

    const handleDeleteFuel = async () => {
        if (!fuelIdToDelete) return;
        
        loadingFuel = true;
        const success = await expenseTracker.deleteFuelExpense(carInfo.VIN, fuelIdToDelete);
        
        if (success) {
             await fetchFuelData();
             createNewNotification({ type: 'success', title: 'Deleted', message: 'Fuel expense deleted', duration: 3000 });
        } else {
             createNewNotification({ type: 'error', title: 'Error', message: 'Failed to delete', duration: 3000 });
        }
        showDeleteFuelConfirm = false;
        fuelIdToDelete = null;
        loadingFuel = false;
    }

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        loadingFuel = true;

        let success = false;

        if (editingExpenseId) {
             success = await expenseTracker.updateFuelExpense(
                carInfo.VIN,
                editingExpenseId,
                new Date(fuelForm.date),
                Number(fuelForm.liters),
                Number(fuelForm.price),
                fuelForm.mileage ? Number(fuelForm.mileage) : undefined
            );
        } else {
            success = await expenseTracker.addFuelExpense(
                carInfo.VIN,
                new Date(fuelForm.date),
                Number(fuelForm.liters),
                Number(fuelForm.price),
                fuelForm.mileage ? Number(fuelForm.mileage) : undefined
            );
        }
        
        if (success) {
            await fetchFuelData();

            if (fuelForm.mileage && (!carInfo.mileage || Number(fuelForm.mileage) > carInfo.mileage)) {
                carStore.updateMileage(carInfo.VIN, Number(fuelForm.mileage));
            }

            createNewNotification({ type: 'success', title: 'Success', message: editingExpenseId ? 'Updated' : 'Added', duration: 3000 });
            resetFuelForm();
        } else {
             createNewNotification({ type: 'error', title: 'Error', message: 'Operation failed', duration: 3000 });
        }
        loadingFuel = false;
    }
</script>

<div class="h-full grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6" in:fade={{ duration: 200 }}>
    <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg h-fit">
        <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-mainAccent/10 flex items-center justify-center text-mainAccent text-xl">⛽</div>
            <h3 class="text-xl font-bold text-mainAccent">{editingExpenseId ? 'Edit Fueling' : 'Add Fueling'}</h3>
        </div>
        
        <form onsubmit={handleFormSubmit} class="space-y-5">
            <div class="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Date</label>
                    <input type="date" bind:value={fuelForm.date} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors" required />
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                        <div>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Volume (L)</label>
                        <input type="number" step="0.01" bind:value={fuelForm.liters} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono" required />
                    </div>
                    <div>
                        <!-- svelte-ignore a11y_label_has_associated_control -->
                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Price / L</label>
                        <input type="number" step="0.01" bind:value={fuelForm.price} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono" required />
                    </div>
                </div>

                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Current Mileage</label>
                    <div class="relative">
                        <input type="number" bind:value={fuelForm.mileage} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono pl-6" 
                            placeholder={editingExpenseId ? "Unchanged" : ""}
                        />
                        <div class="absolute left-0 top-2 opacity-50 text-sm">#</div>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-3 pt-2">
                <button type="submit" disabled={loadingFuel} class="flex-1 bg-linear-to-r from-mainAccent to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
                    {loadingFuel ? 'Saving...' : (editingExpenseId ? 'Update Record' : 'Save Entry')}
                </button>
                {#if editingExpenseId}
                    <button type="button" onclick={resetFuelForm} disabled={loadingFuel} class="px-5 py-3 border border-mainBorder text-mainTextColor rounded-lg hover:bg-white/5 active:scale-95 transition-all font-semibold">
                        Cancel
                    </button>
                {/if}
            </div>
        </form>
    </div>

        <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg overflow-auto max-h-150">
        <h3 class="text-lg font-bold text-mainAccent mb-6 flex justify-between items-center border-b border-white/5 pb-4">
            <span>Filling History</span>
            <div class="flex flex-col items-end">
                <span class="text-xs text-mainTextColor opacity-50 uppercase">Total Cost</span>
                <span class="text-xl font-mono text-white">{consumptionSum.toFixed(2)}</span>
            </div>
        </h3>
        
        {#if loadingFuel && fuelExpenses.length === 0}
            <div class="text-center opacity-50 py-10">Loading...</div>
        {:else if fuelExpenses.length === 0}
                <div class="text-center opacity-50 py-10">No fuel records yet.</div>
        {:else}
            <div class="space-y-3">
                {#each fuelExpenses as expense}
                    <div class="flex justify-between items-center border-b border-gray-700/20 pb-2 group">
                        <div>
                            <div class="font-bold flex items-center gap-2">
                                {new Date(expense.date).toLocaleDateString()}
                            </div>
                            <div class="text-xs opacity-50">{expense.liters.toFixed(2)} L @ {expense.pricePerLiter.toFixed(2)} / L</div>
                        </div>
                        <div class="text-right flex items-center gap-4">
                            <div class="font-bold text-mainAccent">{expense.totalCost.toFixed(2)}</div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick={() => handleStartEdit(expense)} class="p-1 hover:text-blue-400 text-mainTextColor/50 transition-colors" title="Edit">
                                    ✎
                                </button>
                                <button onclick={() => { fuelIdToDelete = expense.id || null; showDeleteFuelConfirm = true; }} class="p-1 hover:text-red-400 text-mainTextColor/50 transition-colors" title="Delete">
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

{#if showDeleteFuelConfirm}
    <ConfirmationDialog
        title="Delete Fuel Entry?"
        message="Are you sure you want to delete this fuel record?"
        confirmText="Yes, delete"
        cancelText="No, cancel"
        onConfirm={handleDeleteFuel}
        onCancel={() => { showDeleteFuelConfirm = false; fuelIdToDelete = null; }}
    />
{/if}
