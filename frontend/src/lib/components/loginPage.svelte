<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import Loader from './loader.svelte';
    import LoginForm from './LoginForm.svelte';
    import RegisterForm from './RegisterForm.svelte';
    import type { OAuthButtons } from '$lib/types/OAuthButtons';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    
    let pageReady = $state(false);
    let loginVisible = $state(true);
    
    const animationDuration = 400;
    
    let buttons = $state<OAuthButtons | undefined>(undefined);
    
    $effect(() => {
        if (buttons !== undefined) {
            pageReady = true;
        }
    });

    pageReady = true;

    onMount(async () => {
        await getButtons();
        // checkForAuthNotification();
    });
    
    function toggleForms() {
        loginVisible = !loginVisible;
    }
    
    async function getButtons() {
        try {
            const response = await fetch('http://localhost:8080/OAuth');
            const data = await response.json();
            console.log(data)
            buttons = data;
        } catch (error) {
            console.error('Error during fetching buttons:', error);
        }
    }
    
    function checkForAuthNotification() {
        if (!browser) return;
        
        const authNotificationCookie = document.cookie
            .split('; ')
            .find(row => row.startsWith('authNotification='));
            
        if (authNotificationCookie) {
            try {
                const notificationData = JSON.parse(decodeURIComponent(authNotificationCookie.split('=')[1]));
                createNewNotification(notificationData);
                
                document.cookie = 'authNotification=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            } catch (error) {
                console.error('Error parsing auth notification:', error);
            }
        }
    }
</script>

{#if !pageReady}
    <Loader/>
{:else}
    <main class="fixed inset-0 flex items-center justify-center overflow-hidden bg-mainBackground">
        <div class="z-20 hidden w-1/2 h-full md:flex md:justify-center md:items-center">
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <!-- <img src="/loginPagePhoto.jpg" alt="Login page photo" class="object-cover w-full h-full"/> -->
            <img src="/logo.svg" alt="Login page photo" class=""/>
        </div>
        <div class="flex items-center justify-center w-1/2 h-full">
            {#if loginVisible}
                <LoginForm {toggleForms} {animationDuration} buttons={buttons || {DISCORD: false, GOOGLE: false, GITHUB: false, GITLAB: false}} />
            {:else}
                <RegisterForm {toggleForms} {animationDuration} />
            {/if}
        </div>
    </main>
{/if}
