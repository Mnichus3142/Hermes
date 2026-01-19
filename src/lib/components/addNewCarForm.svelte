<script lang="ts">
    import { clickOutside } from '$lib/functions/clickOutside';
    import { scale, fade } from 'svelte/transition';
    import ConfirmationDialog from './ConfirmationDialog.svelte';
    import { CarEnum } from '$lib/enums/carEnum';
    import type { CarType } from '$lib/types/carType';
    import { carStore } from '$lib/logic/carStore.svelte';
    import { checkCar } from '$lib/functions/checkCarCreationConditions';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';

    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();
    let showConfirm = $state(false);

    let formData: CarType = $state({
        VIN: '',
        type: CarEnum.COMPACT,
        manufacturer: '',
        model: '',
        year: new Date().getFullYear(),
        mileage: 0,
        licensePlate: '',
        insuranceValidUntil: null,
        technicalInspectionValidUntil: null,
        insuranceValid: null,
        technicalInspectionValid: null
    });

    const handleCloseAttempt = () => {
        showConfirm = true;
    }

    const confirmClose = () => {
        showConfirm = false;
        onClose();
    }

    const cancelClose = () => {
        showConfirm = false;
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        
        const newCar: CarType = { ...formData }

        const response = await fetch('/api/carInfo/saveToDatabase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCar)
        });

        if (!response.ok) {
            const errorData = await response.json();
            createNewNotification({
                title: 'Error',
                message: `Cannot add vehicle: ${errorData.message}`,
                type: 'error',
                duration: 10000
            });
            return;
        }

        const validation = checkCar(newCar);
        if (!validation.valid) {
            createNewNotification({
                title: 'Error',
                message: `Cannot add vehicle: ${validation.errors[0]}`,
                type: 'error',
                duration: 10000
            });
            return;
        }

        carStore.addCar(newCar);

        console.log('New car added:', newCar);

        onClose();
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
                class="text-mainTextColor/50 hover:text-mainAccent transition-colors text-2xl cursor-pointer"
            >
                &times;
            </button>
        </div>

        <!-- Body -->
        <div class="p-8 max-h-[80vh] overflow-y-auto">
            <form class="space-y-6" onsubmit={handleSubmit}>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Car Type -->
                    <div class="formInput">
                        <label for="carType">Car Type</label>
                        <select 
                            id="carType"
                            bind:value={formData.type}
                        >
                            {#each Object.values(CarEnum) as type}
                                <option value={type} class="">{type}</option>
                            {/each}
                        </select>
                    </div>
                    <!-- Manufacturer -->
                    <div class="formInput">
                        <label for="manufacturer">Manufacturer</label>
                        <input 
                            type="text" 
                            id="manufacturer" 
                            bind:value={formData.manufacturer}
                            placeholder="e.g., Toyota"
                        />
                    </div>
                    <!-- Model -->
                    <div class="formInput">
                        <label for="model">Model</label>
                        <input 
                            type="text" 
                            id="model" 
                            bind:value={formData.model}
                            placeholder="e.g., Camry"
                        />
                    </div>
                    <!-- Year -->
                    <div class="formInput">
                        <label for="year">Year</label>
                        <input 
                            type="number" 
                            id="year" 
                            bind:value={formData.year}
                            min="1900"
                            max={new Date().getFullYear()}
                        />
                    </div>
                    <!-- Mileage -->
                    <div class="formInput">
                        <label for="mileage">Mileage (km)</label>
                        <input 
                            type="number" 
                            id="mileage" 
                            bind:value={formData.mileage}
                            min="0"
                            placeholder="e.g., 50000"
                        />
                    </div>
                    <!-- VIN -->
                    <div class="formInput">
                        <label for="vin">VIN</label>
                        <input 
                            type="text" 
                            id="vin" 
                            bind:value={formData.VIN}
                            maxlength="17"
                            placeholder="e.g., 1HGCM82633A123456"
                        />
                    </div>
                    <!-- License Plate -->
                    <div class="formInput">
                        <label for="licensePlate">License Plate</label>
                        <input 
                            type="text" 
                            id="licensePlate" 
                            bind:value={formData.licensePlate}
                            placeholder="e.g., ABC-1234"
                        />
                    </div>
                    <!-- Insurance Valid Until -->
                    <div class="formInput">
                        <label for="insuranceValidUntil">Insurance Valid Until</label>
                        <input 
                            type="date" 
                            id="insuranceValidUntil" 
                            bind:value={formData.insuranceValidUntil}
                        />
                    </div>
                    <!-- Technical Inspection Valid Until -->
                    <div class="formInput">
                        <label for="technicalInspectionValidUntil">Technical Inspection Valid Until</label>
                        <input 
                            type="date" 
                            id="technicalInspectionValidUntil" 
                            bind:value={formData.technicalInspectionValidUntil}
                        />
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
