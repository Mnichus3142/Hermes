<script lang="ts">
    import type { LayoutProps } from "./$types";
    import Notification from "$lib/components/qol/notification.svelte";
    import "../app.css";
    import NavUI from "$lib/components/navigation/navUI.svelte";

    let { children }: LayoutProps = $props();
</script>

<main class="max-w-screen max-h-screen bg-blk">
    <NavUI></NavUI>
    {@render children()}
    <Notification></Notification>
</main>
