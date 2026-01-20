<script lang="ts">
    import { page } from '$app/stores';
    import AddNewCarForm from '$lib/components/addNewCarForm.svelte';
    import CarDetailsOverlay from '$lib/components/CarDetailsOverlay.svelte';
    import TypeWriter from '$lib/components/typeWriter.svelte';
    import { carStore } from '$lib/logic/carStore.svelte';
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    
    let showAddCarForm = $state(false);
    let selectedCar = $state<any>(null);
    let isReady = $state(false);

    let { data } = $props();

    type Tab = 'consumption' | 'details' | 'faults';
    let activeTab = $state<Tab>('details');

    const tabs = [
        { id: 'details', label: 'Details' },
        { id: 'consumption', label: 'Fuel Consumption' },
        { id: 'faults', label: 'Repair History' }
    ];

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

    const openCarDetails = (car: any) => {
        // Find current reactive instance from store
        const currentCar = carStore.cars.find(c => c.getCarInfo().car.VIN === car.getCarInfo().car.VIN);
        selectedCar = currentCar || car;
        activeTab = 'details';
    };

    const closeCarDetails = () => {
        selectedCar = null;
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
            <TypeWriter typeWriterPayload={{ text: `Hello ${$page.data.user?.username}, how are you today?`, delay: 0, speed: 45 }} />
        </div>

        <!-- Navigation Buttons -->
        {#if selectedCar}
           <div class="flex flex-col gap-4 my-auto w-full px-4 justify-center">
              {#each tabs as tab}
                <button 
                    class="py-3 px-4 w-full rounded-xl transition-all duration-500 font-semibold text-sm tracking-wide cursor-pointer
                    {activeTab === tab.id 
                        ? 'bg-mainAccent text-white shadow-2xl scale-110' 
                        : 'bg-mainBackground border border-mainBorder text-mainTextColor shadow-2xl opacity-70 hover:opacity-100 hover:border-mainAccent/50 hover:scale-110 hover:bg-linear-to-r hover:from-mainAccent hover:to-mainAccent/60 hover:text-white hover:backdrop-blur-2xl'}"
                    onclick={() => activeTab = tab.id as Tab}
                >
                    {tab.label}
                </button>
              {/each}
           </div>
        {/if}

        <!-- Logout -->
        <div class="mt-auto w-full flex justify-center pb-4">
            <!-- svelte-ignore event_directive_deprecated -->
            <form onsubmit={logout}>
                <button
                    type="submit"
                    class="logoutButton"
                >
                    <span class="relative top-[0.5px] text-md font-semibold ">
                        Logout
                    </span>
                    <svg width="46" height="46" fill="none" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2 relative -top-0.5">
                        <path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2"></path>
                        <path d="M21 12H7"></path>
                        <path d="m18 15 3-3-3-3"></path>
                    </svg>
                </button>
            </form>
        </div>
    </div>
    <!-- Content -->
    <div class="p-8 overflow-auto h-full flex flex-col relative w-full">
        
        {#if selectedCar}
            <div class="absolute inset-0 p-4 z-10 w-full h-full"> 
                <CarDetailsOverlay car={selectedCar} onClose={closeCarDetails} {activeTab} />
            </div>
        
        {:else}
            <h1 class="text-3xl font-bold mb-8 text-mainAccent" transition:fade>Your Garage</h1>
            
            <!-- Grid for cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" transition:fade>
                
                <!-- Auto add cars -->
                {#each carStore.cars as car}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div 
                        class="bg-mainBackground p-6 rounded-xl border border-mainBorder shadow-lg hover:border-mainAccent transition-all group cursor-pointer hover:shadow-xl hover:scale-[1.02]"
                        transition:fly={{ duration: 600, y: -1000 }}
                        onclick={() => openCarDetails(car)}
                    >
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
                        onclick={toggleAddCarForm}
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
        {/if}
    </div>
</div>

{#if showAddCarForm}
    <AddNewCarForm onClose={toggleAddCarForm} />
{/if}
