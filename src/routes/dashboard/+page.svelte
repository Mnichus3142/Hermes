<script lang="ts">
    import { page } from '$app/stores';
    import AddNewCarForm from '$lib/components/addNewCarForm.svelte';

    let showAddCarForm = $state(false);

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
            <!-- {#each cars as car}
                <div class="bg-mainBackground p-6 rounded-xl border border-mainBorder shadow-lg hover:border-mainAccent transition-all group">
                    <div class="text-mainAccent font-bold text-xl mb-2">{car.make}</div>
                    <div class="text-mainTextColor opacity-80">{car.model}</div>
                    <div class="mt-4 text-xs text-mainTextColor/50 font-mono tracking-widest">{car.vin || 'NO VIN'}</div>
                </div>
            {/each} -->

            <!-- Add Card -->
            <!-- svelte-ignore event_directive_deprecated -->
            <button 
                on:click={toggleAddCarForm}
                class="addVehicleCard"
            >
                <div class="plus">+</div>
                <div class="addVehicleText">Add New Vehicle</div>
            </button>

        </div>
    </div>
</div>

{#if showAddCarForm}
    <AddNewCarForm onClose={toggleAddCarForm} />
{/if}
