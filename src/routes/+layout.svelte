<script lang="ts">
    import type { LayoutProps } from './$types';
    import Notification from '$lib/components/notification.svelte';
    import "../app.css";

    let { children }:LayoutProps = $props();
</script>

<main class="w-screen h-screen bg-main-100">
    <Notification></Notification>
    {@render children()}
</main>