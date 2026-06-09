<!-- * Login page * -->

<script lang="ts">
    import { goto } from "$app/navigation";
    import HomePage from "$lib/components/pages/homePage.svelte";
    import type { PageProps } from "./$types";

    let { data }: PageProps = $props();

    $effect(() => {
        if (data.isLoggedIn) {
            goto("/dashboard");
        }
    });
</script>

<main class="h-full w-full">
    <HomePage />
</main>
