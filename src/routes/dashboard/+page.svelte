<script lang="ts">
    import { page } from '$app/stores';
    import AddNewCarForm from '$lib/components/addNewCarForm.svelte';
    import TypeWriter from '$lib/components/typeWriter.svelte';
    import { carStore } from '$lib/logic/carStore.svelte';
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
    
    let showAddCarForm = $state(false);
    let isReady = $state(false);

    let { data } = $props();

    const items = $derived([
        ...carStore.cars.map(c => ({ type: 'car' as const, car: c, id: c.getCarInfo().car.VIN })),
        ...(isReady ? [{ type: 'add' as const, id: 'add-button' }] : [])
    ]);

    onMount(() => {
        isReady = true;
        if (data.initialCars) {
            carStore.setCars(data.initialCars);
        }
    });

    const toggleAddCarForm = () => {
        showAddCarForm = !showAddCarForm;
    };

    const logout = async () => {
        await fetch('/api/auth/logout', {
            method: 'GET',
            credentials: 'include'
        });

        window.location.href = '/';
    };
</script>

<div class="h-screen w-full grid grid-cols-[1fr_4fr] bg-dashboardBackground ">
    <!-- Menu -->
    <div class="bg-mainBackground/80 backdrop-blur-md p-4 pt-8 flex flex-col items-center shadow-2xl m-4 rounded-lg">
        <!-- Title --> 
        <div class="text-sm dashboardTitle break-after-auto text-center">
            Hello {$page.data.user?.username}, <br/> how are you today?
        </div>


        <!-- Logout -->
        <div class="mt-auto w-full flex justify-center pb-4">
            <!-- svelte-ignore event_directive_deprecated -->
            <form on:submit|preventDefault={logout}>
                <button 
                    type="submit" 
                    class="logoutButton"
                >
                    Logout
                </button>
            </form>
        </div>
    </div>
    <!-- Content -->
    <div class="p-8 overflow-auto">
        <h1 class="text-3xl font-bold mb-8 text-mainAccent">Your Vehicles</h1>
        
        <!-- Grid for cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            <!-- Auto add cars -->
            {#each carStore.cars as car}
                <div class="bg-mainBackground p-6 rounded-xl border border-mainBorder shadow-lg hover:border-mainAccent transition-all group" transition:fly={{ duration: 600, y: -1000 }}>
                    <!-- Image -->
                    <div>
                        <img src="/model/{car.getCarInfo().car.type}/viewLeft.svg" alt="{car.getCarInfo().car.type} image" class="carSVG">
                    </div>
                    <!-- Manufacturer and Model -->
                    <div class="text-mainAccent font-bold text-xl mb-2">{car.getCarInfo().car.manufacturer}</div>
                    <div class="text-mainTextColor opacity-80">{car.getCarInfo().car.model}</div>
                    <!-- Specific info -->
                    <!-- License plate -->
                    <div class="carInfo">Plate: {car.getCarInfo().car.licensePlate || 'N/A'}</div>
                    <!-- Year -->
                    <div class="carInfo">Year: {car.getCarInfo().car.year || 'N/A'}</div>
                    <!-- Mileage -->
                    <div class="carInfo">Mileage: {car.getCarInfo().car.mileage >= 0 ? `${car.getCarInfo().car.mileage} km` : 'N/A'}</div>
                    <!-- Insurance -->
                    <div class="carInfo flex justify-start items-center gap-2">
                        Insurance:
                        {#if car.getCarInfo().car.insuranceValidUntil}
                            {#if new Date(car.getCarInfo().car.insuranceValidUntil as Date) > new Date()}
                                <span class="flex text-green-400">
                                    <img src="/greenDot.svg" alt="greenDot" class="h-4 mr-2">
                                    Valid
                                </span>
                            {:else}
                                <span class="flex text-red-500">
                                    <img src="/redDot.svg" alt="greenDot" class="h-4 mr-2">
                                    Expired
                                </span>
                            {/if}
                        {:else}
                            N/A
                        {/if}
                    </div>
                    <!-- Technical inspection -->
                    <div class="carInfo flex justify-start items-center gap-2">
                        Inspection:
                        {#if car.getCarInfo().car.technicalInspectionValidUntil}
                            {#if new Date(car.getCarInfo().car.technicalInspectionValidUntil as Date) > new Date()}
                                <span class="flex text-green-400">
                                    <img src="/greenDot.svg" alt="greenDot" class="h-4 mr-2">
                                    Valid
                                </span>
                            {:else}
                                <span class="flex text-red-500">
                                    <img src="/redDot.svg" alt="greenDot" class="h-4 mr-2">
                                    Expired
                                </span>
                            {/if}
                        {:else}
                            N/A
                        {/if}
                    </div>
                    <!-- VIN -->
                    <div class="carInfo">VIN: {car.getCarInfo().car.VIN || 'NO VIN'}</div>
                </div>
            {/each}

            <!-- Add Card -->
            {#if isReady}
                <!-- svelte-ignore event_directive_deprecated -->
                <button 
                    on:click={toggleAddCarForm}
                    class="addVehicleCard"
                    transition:fly={{ duration: 600, y: -1000 }}
                >
                    <div class="plus">+</div>
                    <div class="addVehicleText">
                        <TypeWriter typeWriterPayload={{ text: "Add New Vehicle", delay: 400 }} />
                    </div>
                </button>
            {/if}

        </div>
    </div>
</div>

{#if showAddCarForm}
    <AddNewCarForm onClose={toggleAddCarForm} />
{/if}
