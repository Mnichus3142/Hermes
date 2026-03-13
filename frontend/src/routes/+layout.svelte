<script lang="ts">
    import type { LayoutProps } from './$types';
    import Notification from '$lib/components/notification.svelte';
    import "../app.css";

    let { children }:LayoutProps = $props();
</script>

<main class="max-w-screen max-h-screen bg-blk">
    {@render children()}
    <Notification></Notification>
</main>