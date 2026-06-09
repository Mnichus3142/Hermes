<script lang="ts">
    import CarCard from "$lib/components/garage/CarCard.svelte";
    import AddCarForm from "$lib/components/garage/AddCarForm.svelte";
    import { normalizeCarParameters, type Car } from "$lib/types/car";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let showAddForm = $state(false);

    const cars = $derived(data.cars as Car[]);
    const parameters = $derived(normalizeCarParameters(data.parameters));
</script>

<svelte:head>
    <title>Garage | Hermes</title>
</svelte:head>

<section class="garagePage">
    <header class="garagePageHeader">
        <h1 class="garagePageTitle">Garage</h1>
        <p class="garagePageSubtitle">
            {cars.length}
            {cars.length === 1 ? "vehicle" : "vehicles"}
        </p>
    </header>

    {#if cars.length === 0}
        <p class="garageEmptyState">
            No cars in your garage yet. Add your first car to start tracking it.
        </p>
    {/if}

    <div class="garageGrid">
        {#each cars as car, index (car._id ?? `${car.make}-${car.model}-${index}`)}
            <CarCard {car} />
        {/each}

        <button
            type="button"
            onclick={() => (showAddForm = true)}
            class="garageAddCard"
            aria-label="Add new car"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                class="garageAddCardIcon"
            >
                <path
                    d="M440-440H240v-80h200v-200h80v200h200v80H520v200h-80v-200Z"
                />
            </svg>
            <span class="garageAddCardLabel">Add car</span>
        </button>
    </div>
</section>

<AddCarForm
    {parameters}
    open={showAddForm}
    onClose={() => (showAddForm = false)}
/>
