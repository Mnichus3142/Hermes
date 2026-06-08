<!-- * Login page * -->

<script lang="ts">
    import { goto } from "$app/navigation";
    import Loader from "$lib/components/qol/loader.svelte";
    import HomePage from "$lib/components/pages/homePage.svelte";
    import { isLoggedIn } from "$lib/store/store";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();
    let loadState: Boolean = false;

    $effect(() => {
        if (data.isLoggedIn) {
            goto("/dashboard");
        }
    });
</script>

<main class="h-full w-full">
    {#if loadState}
        <Loader />
    {:else}
        <HomePage />
    {/if}
</main>
