<script lang="ts">
    import { cubicInOut } from 'svelte/easing';
    import { slide } from 'svelte/transition';
    import { clickOutside } from '$lib/functions/clickOutside';

    let { isLoggedIn } = $props();

    let menuOpen = $state(false);

    const options = [
        { label: 'Profile', action: () => console.log('Go to profile') },
        { label: 'Settings', action: () => console.log('Go to settings') },
        { label: 'Logout', action: () => console.log('Logout') }
    ]

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };
</script>

<!-- Icon and corresponding menu -->
<div class="profileMenu">
    <button title="Profile button" onclick={toggleMenu} class="profileMenuButton">
        <svg width="46" height="46" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
        </svg>
    </button>

    {#if menuOpen}
        <div class="menu" transition:slide={{ duration: 150, easing: cubicInOut }} use:clickOutside onclick_outside={(e: Event) => {
                if (e.target instanceof HTMLElement && !e.target.closest('.profileMenu')) {
                    menuOpen = false;
                }
            }}>
            {#if isLoggedIn}
                {#each options as option}
                    <button onclick={option.action} class="menuItem">{option.label}</button><br>
                {/each}
            {/if}
        </div>
    {/if}
</div>
