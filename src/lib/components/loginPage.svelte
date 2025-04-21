<script lang="ts">
    import { onMount } from 'svelte';
    import Loader from './loader.svelte';
    import LoginForm from './LoginForm.svelte';
    import RegisterForm from './RegisterForm.svelte';
    import type { OAuthButtons } from '$lib/types/OAuthButtons';
    
    // State variables (Svelte 5)
    let pageReady = $state(false);
    let loginVisible = $state(true);
    
    // Constants
    const animationDuration = 400;
    
    // OAuth buttons
    let buttons = $state<OAuthButtons | undefined>(undefined);
    
    // Effect fetching buttons
    $effect(() => {
        if (buttons !== undefined) {
            pageReady = true;
        }
    });

    // After mounting fetch buttons
    onMount(async () => {
        await getButtons();
    });
    
    // Function toggling between forms
    function toggleForms() {
        loginVisible = !loginVisible;
    }
    
    // Function to fetch buttons
    async function getButtons() {
        try {
            const response = await fetch('/api/info/OAuth');
            const data = await response.json();
            buttons = data;
        } catch (error) {
            console.error('Error during fetching buttons:', error);
        }
    }
</script>

{#if !pageReady}
    <Loader/>
{:else}
    <main class="fixed inset-0 flex items-center justify-center overflow-hidden bg-main-100">
        <!-- Page photo -->
        <div class="z-20 hidden w-1/2 h-full shadow-2xl md:block">
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <img src="/loginPagePhoto.jpg" alt="Login page photo" class="object-cover w-full h-full"/>
        </div>
        <div class="flex items-center justify-center w-1/2 h-full">
            {#if loginVisible}
                <LoginForm {toggleForms} {animationDuration} buttons={buttons || {discord: false, google: false, github: false, gitlab: false}} />
            {:else}
                <RegisterForm {toggleForms} {animationDuration} />
            {/if}
        </div>
    </main>
{/if}