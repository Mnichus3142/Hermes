<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import AddNewCarForm from './addNewCarForm.svelte';
    import { carStore } from '$lib/logic/carStore.svelte';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    import ConfirmationDialog from './ConfirmationDialog.svelte';
    import { ExpenseTracker } from '$lib/logic/expenseTracker';
    import { fuelExpense } from '$lib/logic/fuelExpense';
    import { RepairCategories } from '$lib/enums/repairEnum';
  import type { repairExpense } from '$lib/logic/repairExpense';

    let { car, onClose, activeTab } = $props();
    
    let carInfo = $derived(car.getCarInfo().car);
    
    let showEditForm = $state(false);
    let showDeleteConfirm = $state(false);

    // Categories
    const repairCategories = RepairCategories;

    // Fuel Consumption Logic

    let expenseTracker = new ExpenseTracker();
    let fuelExpenses = $state<fuelExpense[]>([]);
    let editingExpenseId = $state<number|null>(null);
    let showDeleteFuelConfirm = $state(false);
    let fuelIdToDelete = $state<number|null>(null);
    
    let fuelForm = $state({
        date: new Date().toISOString().split('T')[0],
        liters: 0,
        price: 0,
        mileage: undefined as number | undefined
    });
    let loadingFuel = $state(false);

    // Repair Logic
    let repairExpenses = $state<repairExpense[]>([]);
    let editingRepairId = $state<number|null>(null);
    let showDeleteRepairConfirm = $state(false);
    let repairIdToDelete = $state<number|null>(null);
    let selectedRepair = $state<repairExpense|null>(null);

    let repairForm = $state({
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: 0,
        mileage: undefined as number | undefined,
        subCategory: 'OTHER'
    });
    let loadingRepairs = $state(false);

    $effect(() => {
        if (activeTab === 'consumption' && carInfo?.VIN) {
            loadingFuel = true;
            expenseTracker.loadExpenses(carInfo.VIN).then(() => {
                fuelExpenses = expenseTracker.expenses;
                loadingFuel = false;
            });
        }
        if (activeTab === 'faults' && carInfo?.VIN) {
            loadingRepairs = true;
            expenseTracker.loadExpenses(carInfo.VIN).then(() => {
                repairExpenses = expenseTracker.repairs;
                loadingRepairs = false;
            });
        }
    });

    // --- FUEL METHODS ---
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
             fuelExpenses = expenseTracker.expenses;
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
            fuelExpenses = expenseTracker.expenses;

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

    // --- REPAIR METHODS ---
    const resetRepairForm = () => {
        repairForm = {
            date: new Date().toISOString().split('T')[0],
            description: '',
            cost: 0,
            mileage: undefined,
            subCategory: 'OTHER'
        };
        editingRepairId = null;
    }

    const handleStartEditRepair = (repair: repairExpense) => {
        if (!repair.id) return;
        editingRepairId = repair.id;
        repairForm = {
            date: repair.date.toISOString().split('T')[0],
            description: repair.description,
            cost: repair.cost,
            mileage: repair.mileage,
            subCategory: repair.subCategory || 'OTHER'
        };
    }

    const handleDeleteRepair = async () => {
        if (!repairIdToDelete) return;
        
        loadingRepairs = true;
        const success = await expenseTracker.deleteRepairExpense(carInfo.VIN, repairIdToDelete);
        
        if (success) {
             repairExpenses = expenseTracker.repairs;
             createNewNotification({ type: 'success', title: 'Deleted', message: 'Repair record deleted', duration: 3000 });
        } else {
             createNewNotification({ type: 'error', title: 'Error', message: 'Failed to delete', duration: 3000 });
        }
        showDeleteRepairConfirm = false;
        repairIdToDelete = null;
        loadingRepairs = false;
    }

    const handleRepairFormSubmit = async (e: Event) => {
        e.preventDefault();
        loadingRepairs = true;

        let success = false;

        if (editingRepairId) {
             success = await expenseTracker.updateRepairExpense(
                carInfo.VIN,
                editingRepairId,
                new Date(repairForm.date),
                repairForm.description,
                Number(repairForm.cost),
                repairForm.mileage ? Number(repairForm.mileage) : undefined,
                repairForm.subCategory
            );
        } else {
            success = await expenseTracker.addRepairExpense(
                carInfo.VIN,
                new Date(repairForm.date),
                repairForm.description,
                Number(repairForm.cost),
                repairForm.mileage ? Number(repairForm.mileage) : undefined,
                repairForm.subCategory
            );
        }
        
        if (success) {
            repairExpenses = expenseTracker.repairs;
             if (repairForm.mileage && (!carInfo.mileage || Number(repairForm.mileage) > carInfo.mileage)) {
                carStore.updateMileage(carInfo.VIN, Number(repairForm.mileage));
            }
            createNewNotification({ type: 'success', title: 'Success', message: editingRepairId ? 'Updated' : 'Added', duration: 3000 });
            resetRepairForm();
        } else {
             createNewNotification({ type: 'error', title: 'Error', message: 'Operation failed', duration: 3000 });
        }
        loadingRepairs = false;
    }

    const handleDelete = async () => {
        try {
            const response = await fetch('/api/carInfo/deleteFromDatabase', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vin: carInfo.VIN })
            });

            if (response.ok) {
                carStore.deleteCar(carInfo.VIN);
                createNewNotification({
                    title: 'Success',
                    message: 'Vehicle deleted successfully',
                    type: 'success',
                    duration: 3000,
                });
                onClose();
            } else {
                 const errorData = await response.json();
                 createNewNotification({
                    title: 'Error',
                    message: `Failed to delete: ${errorData.message}`,
                    type: 'error',
                    duration: 3000,
                });
            }
        } catch (error) {
             createNewNotification({
                title: 'Error',
                message: 'Failed to delete vehicle',
                type: 'error',
                duration: 3000,
            });
        }
    }

    const toggleEditForm = () => {
        showEditForm = !showEditForm;
    }
</script>

<!-- No backdrop, just content wrapper -->
<div 
    class="w-full h-full bg-mainBackground border-0 shadow-none flex flex-col overflow-hidden"
    transition:fade={{ duration: 200 }}
>
    <!-- Header -->
    <div class="p-6 border-b border-mainBorder flex justify-between items-center bg-gray-50/5">
        <div>
            <div 
                class="flex items-center gap-2 cursor-pointer text-mainTextColor opacity-70 hover:opacity-100 transition-opacity mb-2"
                onclick={onClose}
                role="button"
                tabindex="0"
                onkeydown={(e) => e.key === 'Enter' && onClose()}
            >
                <div class="text-xl">←</div> 
                <span class="text-sm font-semibold">Back to Garage</span>
            </div>

            <h2 class="text-3xl font-bold text-mainAccent font-title">
                {carInfo.manufacturer} {carInfo.model}
            </h2>
            <span class="text-sm text-mainTextColor opacity-70 tracking-wider">
                {carInfo.licensePlate || 'NO PLATE'}
            </span>
        </div>
        
        <div class="flex gap-2">
            <button 
                onclick={toggleEditForm}
                class="px-4 py-2 text-sm bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg transition-colors font-semibold"
            >
                Edit Details
            </button>
            <button 
                onclick={() => showDeleteConfirm = true}
                class="px-4 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors font-semibold"
            >
                Delete
            </button>
        </div>
    </div>

        <!-- Tabs removed from here -->
            
            {#if activeTab === 'details'}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6" in:fade={{ duration: 200 }}>
                    <!-- Main Info -->
                    <div class="bg-mainBackground p-6 rounded-lg border border-mainBorder shadow-sm">
                        <h3 class="text-lg font-bold text-mainAccent mb-4">Vehicle Information</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">VIN</span>
                                <span class="font-mono">{carInfo.VIN || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Year</span>
                                <span>{carInfo.year}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Type</span>
                                <span class="capitalize">{carInfo.type}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Mileage</span>
                                <span>{carInfo.mileage} km</span>
                            </div>
                        </div>
                    </div>

                    <!-- Status -->
                    <div class="bg-mainBackground p-6 rounded-lg border border-mainBorder shadow-sm">
                        <h3 class="text-lg font-bold text-mainAccent mb-4">Status & Validity</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-mainTextColor opacity-70">Insurance</span>
                                {#if carInfo.insuranceValidUntil && new Date(carInfo.insuranceValidUntil) > new Date()}
                                    <span class="text-green-400 text-sm bg-green-400/10 px-2 py-1 rounded">Valid until {new Date(carInfo.insuranceValidUntil).toLocaleDateString()}</span>
                                {:else}
                                    <span class="text-red-400 text-sm bg-red-400/10 px-2 py-1 rounded">Expired or Missing</span>
                                {/if}
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-mainTextColor opacity-70">Inspection</span>
                                {#if carInfo.technicalInspectionValidUntil && new Date(carInfo.technicalInspectionValidUntil) > new Date()}
                                    <span class="text-green-400 text-sm bg-green-400/10 px-2 py-1 rounded">Valid until {new Date(carInfo.technicalInspectionValidUntil).toLocaleDateString()}</span>
                                {:else}
                                    <span class="text-red-400 text-sm bg-red-400/10 px-2 py-1 rounded">Expired or Missing</span>
                                {/if}
                            </div>
                        </div>

                        <h3 class="text-lg font-bold text-mainAccent mt-8 mb-4">Specifications</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Engine</span>
                                <span>{carInfo.engineCapacity ? `${carInfo.engineCapacity} cm³` : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Fuel</span>
                                <span>{carInfo.fuelType || 'N/A'}</span>
                            </div>
                            <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Power / Torque</span>
                                <span>{carInfo.power ? `${carInfo.power} HP` : '-'} / {carInfo.torque ? `${carInfo.torque} Nm` : '-'}</span>
                            </div>
                             <div class="flex justify-between border-b border-gray-700/20 pb-2">
                                <span class="text-mainTextColor opacity-70">Transmission</span>
                                <span>{carInfo.transmissionType || 'N/A'} {carInfo.gears ? `(${carInfo.gears} gears)` : ''}</span>
                            </div>
                        </div>
                    </div>
                </div>

            {:else if activeTab === 'consumption'}
                <div class="h-full grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6" in:fade={{ duration: 200 }}>
                    <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg h-fit">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 rounded-full bg-mainAccent/10 flex items-center justify-center text-mainAccent text-xl">⛽</div>
                            <h3 class="text-xl font-bold text-mainAccent">{editingExpenseId ? 'Edit Fueling' : 'Add Fueling'}</h3>
                        </div>
                        
                        <form onsubmit={handleFormSubmit} class="space-y-5">
                            <div class="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                                <div>
                                    <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Date</label>
                                    <input type="date" bind:value={fuelForm.date} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors" required />
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                     <div>
                                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Volume (L)</label>
                                        <input type="number" step="0.01" bind:value={fuelForm.liters} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono" required />
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Price / L</label>
                                        <input type="number" step="0.01" bind:value={fuelForm.price} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono" required />
                                    </div>
                                </div>

                                <div>
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
                                <button type="submit" disabled={loadingFuel} class="flex-1 bg-gradient-to-r from-mainAccent to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
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

                     <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg overflow-auto max-h-[600px]">
                        <h3 class="text-lg font-bold text-mainAccent mb-6 flex justify-between items-center border-b border-white/5 pb-4">
                            <span>Filling History</span>
                            <div class="flex flex-col items-end">
                                <span class="text-xs text-mainTextColor opacity-50 uppercase">Total Cost</span>
                                <span class="text-xl font-mono text-white">{expenseTracker.calculateTotalFuelExpenses().toFixed(2)}</span>
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

            {:else if activeTab === 'faults'}
                <div class="h-full grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6" in:fade={{ duration: 200 }}>
                    <!-- ADD/EDIT FORM -->
                    <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg h-fit">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-10 h-10 rounded-full bg-mainAccent/10 flex items-center justify-center text-mainAccent text-xl">🔧</div>
                             <h3 class="text-xl font-bold text-mainAccent">{editingRepairId ? 'Edit Repair' : 'Log Maintenance'}</h3>
                        </div>

                        <form onsubmit={handleRepairFormSubmit} class="space-y-5">
                            <div class="bg-black/20 p-4 rounded-lg border border-white/5 space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Date</label>
                                        <input type="date" bind:value={repairForm.date} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors" required />
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Category</label>
                                        <select bind:value={repairForm.subCategory} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors appearance-none cursor-pointer">
                                            {#each repairCategories as cat}
                                                <option value={cat} class="bg-gray-800">{cat}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Description</label>
                                    <textarea rows="3" bind:value={repairForm.description} class="w-full bg-transparent border border-mainBorder rounded p-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors text-sm" placeholder="What was fixed?" required></textarea>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Cost</label>
                                        <input type="number" step="0.01" bind:value={repairForm.cost} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono" required />
                                    </div>
                                    <div>
                                        <label class="text-xs font-bold text-mainTextColor opacity-50 uppercase tracking-wider mb-1 block">Mileage</label>
                                        <input type="number" bind:value={repairForm.mileage} class="w-full bg-transparent border-b border-mainBorder py-2 text-mainTextColor focus:border-mainAccent outline-none transition-colors font-mono" placeholder={editingRepairId ? "Unchanged" : "Current km"} />
                                    </div>
                                </div>
                            </div>

                             <div class="flex gap-3 pt-2">
                                <button type="submit" disabled={loadingRepairs} class="flex-1 bg-gradient-to-r from-mainAccent to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
                                    {loadingRepairs ? 'Saving...' : (editingRepairId ? 'Update Record' : 'Save Record')}
                                </button>
                                {#if editingRepairId}
                                    <button type="button" onclick={resetRepairForm} disabled={loadingRepairs} class="px-5 py-3 border border-mainBorder text-mainTextColor rounded-lg hover:bg-white/5 active:scale-95 transition-all font-semibold">
                                        Cancel
                                    </button>
                                {/if}
                            </div>
                        </form>
                    </div>

                    <!-- REPAIR LIST -->
                    <div class="bg-mainBackground/50 backdrop-blur-sm p-6 rounded-xl border border-mainBorder shadow-lg overflow-auto max-h-[600px]">
                        <h3 class="text-lg font-bold text-mainAccent mb-6 flex justify-between items-center border-b border-white/5 pb-4">
                            <span>Service History</span>
                            <div class="flex flex-col items-end">
                                <span class="text-xs text-mainTextColor opacity-50 uppercase">Total Spent</span>
                                <span class="text-xl font-mono text-white">{expenseTracker.calculateTotalRepairExpenses().toFixed(2)}</span>
                            </div>
                        </h3>

                        {#if loadingRepairs && repairExpenses.length === 0}
                            <div class="text-center opacity-50 py-10">Loading...</div>
                        {:else if repairExpenses.length === 0}
                             <div class="text-center opacity-50 py-10">No records found.</div>
                        {:else}
                            <div class="space-y-3">
                                {#each repairExpenses as repair}
                                    <div class="flex justify-between items-center border-b border-gray-700/20 pb-2 group">
                                        <div class="flex gap-4 items-center">
                                            <div class="w-10 h-10 rounded bg-mainAccent/10 flex items-center justify-center text-mainAccent font-bold text-xl">
                                                🔧
                                            </div>
                                            <div>
                                                <div class="font-bold">{repair.description.substring(0, 30)}{repair.description.length > 30 ? '...' : ''}</div>
                                                <div class="text-xs opacity-50">{new Date(repair.date).toLocaleDateString()} {repair.mileage ? `• ${repair.mileage} km` : ''}</div>
                                            </div>
                                        </div>
                                        
                                        <div class="text-right flex items-center gap-4">
                                            <div class="font-bold text-mainAccent">{repair.cost.toFixed(2)}</div>
                                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onclick={() => selectedRepair = repair} class="p-1 hover:text-green-400 text-mainTextColor/50 transition-colors" title="View Details">
                                                    👁️
                                                </button>
                                                 <button onclick={() => handleStartEditRepair(repair)} class="p-1 hover:text-blue-400 text-mainTextColor/50 transition-colors" title="Edit">
                                                    ✎
                                                </button>
                                                <button onclick={() => { repairIdToDelete = repair.id || null; showDeleteRepairConfirm = true; }} class="p-1 hover:text-red-400 text-mainTextColor/50 transition-colors" title="Delete">
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
            {/if}
        </div>
{#if showEditForm}
    <AddNewCarForm 
        onClose={toggleEditForm} 
        carToEdit={carInfo}
    />
{/if}

{#if showDeleteConfirm}
    <ConfirmationDialog
        title="Delete Vehicle?"
        message="Are you sure you want to delete this vehicle? This action cannot be undone."
        confirmText="Yes, delete"
        cancelText="No, cancel"
        onConfirm={handleDelete}
        onCancel={() => showDeleteConfirm = false}
    />
{/if}

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

{#if selectedRepair}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div 
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
        transition:fade={{ duration: 150 }}
        onclick={() => selectedRepair = null}
        role="dialog"
        tabindex="-1"
    >
        <div 
            class="bg-mainBackground border border-mainBorder rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden relative" 
            onclick={(e) => e.stopPropagation()} 
            in:scale={{ start: 0.95, duration: 200 }}
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
                    <!-- Cost Card -->
                    <div class="bg-gradient-to-br from-mainAccent/20 to-blue-900/20 p-6 rounded-2xl border border-mainAccent/20 flex justify-between items-center">
                        <div>
                            <div class="text-xs font-bold text-mainAccent opacity-80 uppercase tracking-widest mb-1">Total Cost</div>
                            <div class="text-4xl font-mono text-white font-bold">{selectedRepair.cost.toFixed(2)}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-xs opacity-50 mb-1 uppercase tracking-wide">Mileage</div>
                            <div class="font-bold text-lg font-mono">{selectedRepair.mileage ? `${selectedRepair.mileage} km` : 'N/A'}</div>
                        </div>
                    </div>

                    <!-- Description -->
                    <div>
                    <div class="text-sm font-bold opacity-50 uppercase tracking-widest mb-3">Technician Notes</div>
                    <div class="bg-white/5 p-6 rounded-xl border border-white/5 text-sm leading-7 text-gray-300 whitespace-pre-wrap font-mono">
                        {selectedRepair.description}
                    </div>
                    </div>

                    <!-- Actions -->
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
