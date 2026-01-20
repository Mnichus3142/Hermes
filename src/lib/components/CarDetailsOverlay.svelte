<script lang="ts">
    import { fade } from 'svelte/transition';
    import AddNewCarForm from './addNewCarForm.svelte';
    import { carStore } from '$lib/logic/carStore.svelte';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    import ConfirmationDialog from './ConfirmationDialog.svelte';
    import { ExpenseTracker } from '$lib/logic/expenseTracker';
    import CarDetailsHeader from './CarDetailsHeader.svelte';
    import VehicleInfoTab from './VehicleInfoTab.svelte';
    import FuelConsumptionTab from './FuelConsumptionTab.svelte';
    import MaintenanceTab from './MaintenanceTab.svelte';

    let { car, onClose, activeTab } = $props();
    
    let carInfo = $derived(car.getCarInfo().car);
    
    let showEditForm = $state(false);
    let showDeleteConfirm = $state(false);

    let expenseTracker = new ExpenseTracker();

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
    class="w-full h-full bg-mainBackground/65 border-0 flex flex-col overflow-hidden rounded-lg backdrop-blur-md shadow-2xl"
    transition:fade={{ duration: 200 }}
>
    <CarDetailsHeader 
        {carInfo} 
        {onClose} 
        {toggleEditForm} 
        bind:showDeleteConfirm 
    />

    <div class="flex-1 overflow-auto p-6">
        {#if activeTab === 'details'}
            <VehicleInfoTab {carInfo} />
        {:else if activeTab === 'consumption'}
            <FuelConsumptionTab {carInfo} {expenseTracker} />
        {:else if activeTab === 'faults'}
            <MaintenanceTab {carInfo} {expenseTracker} />
        {/if}
    </div>
</div>

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

{#if showEditForm}
    <AddNewCarForm carToEdit={car.getCarInfo().car} onClose={toggleEditForm} />
{/if}

