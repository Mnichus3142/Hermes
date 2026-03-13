<!-- * Login page * -->

<script lang="ts">
    import LoginPage from "$lib/components/loginPage.svelte";
    import Loader from "$lib/components/loader.svelte";

    let loadState: Boolean = false;
</script>

<main class="h-full w-full">
    {#if loadState}
        <Loader />
    {:else}
        <LoginPage />
    {/if}
</main>
