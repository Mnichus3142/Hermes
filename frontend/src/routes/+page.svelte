<!-- * Login page * -->

<script lang="ts">
    import Loader from "$lib/components/qol/loader.svelte";
    import HomePage from "$lib/components/pages/homePage.svelte";

    let loadState: Boolean = false;
</script>

<main class="h-full w-full">
    {#if loadState}
        <Loader />
    {:else}
        <HomePage />
    {/if}
</main>
