<script lang="ts">
    import type { LayoutProps } from "./$types";
    import Notification from "$lib/components/qol/notification.svelte";
    import "../app.css";
    import NavUI from "$lib/components/navigation/navUI.svelte";
    import { loginVisible, isLoggedIn } from "$lib/store/store";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    let { children, data }: LayoutProps = $props();

    $effect(() => {
        isLoggedIn.set(data.isLoggedIn);
    });
</script>

<main class="max-w-screen max-h-screen h-screen bg-gunmetal-50 z-4000">
    {#if !$loginVisible}
        <div
            in:fly={{
                y: -100,
                duration: 300,
                easing: quintOut,
            }}
            out:fly={{ y: -100, duration: 300, easing: quintOut }}
        >
            <NavUI isLoggedIn={$isLoggedIn}></NavUI>
        </div>
    {/if}
    {@render children()}
    <Notification></Notification>
</main>
