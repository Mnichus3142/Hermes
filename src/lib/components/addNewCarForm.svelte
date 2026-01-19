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
        carToEdit?: CarType | null;
    }

    let { onClose, carToEdit = null }: Props = $props();
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
        technicalInspectionValid: null,
        engineCapacity: undefined,
        fuelType: undefined,
        power: undefined,
        torque: undefined,
        transmissionType: undefined,
        gears: undefined
    });

    $effect(() => {
        if (carToEdit) {
            formData.VIN = carToEdit.VIN;
            formData.type = carToEdit.type;
            formData.manufacturer = carToEdit.manufacturer;
            formData.model = carToEdit.model;
            formData.year = carToEdit.year;
            formData.mileage = carToEdit.mileage;
            formData.licensePlate = carToEdit.licensePlate;
            formData.insuranceValidUntil = carToEdit.insuranceValidUntil 
                ? new Date(carToEdit.insuranceValidUntil).toISOString().split('T')[0] as unknown as Date 
                : null;
            formData.technicalInspectionValidUntil = carToEdit.technicalInspectionValidUntil 
                ? new Date(carToEdit.technicalInspectionValidUntil).toISOString().split('T')[0] as unknown as Date 
                : null;
            formData.insuranceValid = carToEdit.insuranceValid;
            formData.technicalInspectionValid = carToEdit.technicalInspectionValid;
            formData.engineCapacity = carToEdit.engineCapacity;
            formData.fuelType = carToEdit.fuelType;
            formData.power = carToEdit.power;
            formData.torque = carToEdit.torque;
            formData.transmissionType = carToEdit.transmissionType;
            formData.gears = carToEdit.gears;
        }
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
        
        const newCar: CarType = { ...formData };
        const url = carToEdit ? '/api/carInfo/updateInDatabase' : '/api/carInfo/saveToDatabase';
        const method = carToEdit ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newCar)
        });

        if (!response.ok) {
            const errorData = await response.json();
            createNewNotification({
                title: 'Error',
                message: `Cannot ${carToEdit ? 'update' : 'add'} vehicle: ${errorData.message}`,
                type: 'error',
                duration: 10000
            });
            return;
        }

        const validation = checkCar(newCar);
        if (!validation.valid) {
            createNewNotification({
                title: 'Error',
                message: `Cannot ${carToEdit ? 'update' : 'add'} vehicle: ${validation.errors[0]}`,
                type: 'error',
                duration: 10000
            });
            return;
        }

        if (carToEdit) {
            carStore.updateCar(newCar);
            console.log('Car updated:', newCar);
        } else {
            carStore.addCar(newCar);
            console.log('New car added:', newCar);
        }

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
            <h2 class="text-2xl font-bold text-mainAccent font-title">{carToEdit ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <button 
                onclick={handleCloseAttempt}
                class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors text-mainTextColor text-xl font-bold cursor-pointer"
            >
                ✕
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
                            disabled={!!carToEdit}
                            class={carToEdit ? 'opacity-50 cursor-not-allowed' : ''}
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
                    <!-- New Fields -->
                    <!-- Engine Capacity -->
                    <div class="formInput">
                        <label for="engineCapacity">Engine Capacity (cm³)</label>
                        <input 
                            type="number" 
                            id="engineCapacity" 
                            bind:value={formData.engineCapacity}
                            placeholder="e.g., 1998"
                            min="0"
                        />
                    </div>
                    <!-- Fuel Type -->
                    <div class="formInput">
                        <label for="fuelType">Fuel Type</label>
                        <input 
                            type="text" 
                            id="fuelType" 
                            bind:value={formData.fuelType}
                            placeholder="e.g., Petrol, Diesel, Electric"
                        />
                    </div>
                    <!-- Power -->
                    <div class="formInput">
                        <label for="power">Power (HP)</label>
                        <input 
                            type="number" 
                            id="power" 
                            bind:value={formData.power}
                            placeholder="e.g., 150"
                            min="0"
                        />
                    </div>
                    <!-- Torque -->
                    <div class="formInput">
                        <label for="torque">Torque (Nm)</label>
                        <input 
                            type="number" 
                            id="torque" 
                            bind:value={formData.torque}
                            placeholder="e.g., 350"
                            min="0"
                        />
                    </div>
                    <!-- Transmission Type -->
                    <div class="formInput">
                        <label for="transmissionType">Transmission Type</label>
                        <input 
                            type="text" 
                            id="transmissionType" 
                            bind:value={formData.transmissionType}
                            placeholder="e.g., Automatic, Manual"
                        />
                    </div>
                    <!-- Gears -->
                    <div class="formInput">
                        <label for="gears">Number of Gears</label>
                        <input 
                            type="number" 
                            id="gears" 
                            bind:value={formData.gears}
                            placeholder="e.g., 6"
                            min="0"
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
