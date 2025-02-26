<script lang="ts">
    import type { LayoutProps } from './$types';
    import "../app.css";

    let { children }:LayoutProps = $props();
</script>

<main class="h-screen w-screen bg-main-100">
    {@render children()}
</main>