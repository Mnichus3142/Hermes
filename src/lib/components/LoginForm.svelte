<script lang="ts">
    import { fly, draw, fade } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import type { OAuthButtons } from '$lib/types/OAuthButtons';
    import OAuthButtonsComponent from './OAuthButtons.svelte';
    import type { checkPasswordsType } from '$lib/types/checkPasswords';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    
    const { toggleForms, animationDuration, buttons } = $props<{
        toggleForms: () => void;
        animationDuration: number;
        buttons: OAuthButtons;
    }>();
    
    let username = $state('');
    let loginPassword = $state('password');
    let passwordCheck: checkPasswordsType = $state({
        doPasswordsMatch: false,
        firstPassword: '',
        secondPassword: '',
        message: '',
        conditions: {
            isAtLeast8Characters: false,
            hasAtLeast1UppercaseLetter: false,
            hasAtLeast1LowercaseLetter: false,
            hasAtLeast1Number: false,
            hasAtLeast1SpecialCharacter: false,
            allConditionsMet: false
        }
    });

    async function handleInternalLogin(e: Event) {
        e.preventDefault();

        if (passwordCheck.firstPassword === '' || username === '') {
            createNewNotification({
                title: 'Could not log in',
                message: 'Password and username cannot be empty',
                type: 'error',
                duration: 3000
            });

            return 0;
        }

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    password: passwordCheck.firstPassword,
                })
            });

            const data = await response.json();
            if (!data.success) {
                createNewNotification({
                    title: data.title,
                    message: data.message,
                    type: 'error',
                    duration: 3000
                });
                throw new Error('409');
            }
        }

        catch (error: any) {
            if (error.message !== '409') {
                console.error('Error during logging in:', error);
                createNewNotification({
                    title: 'Error during logging in',
                    message: error.message || 'There was an unknown error during logging in',
                    type: 'error',
                    duration: 3000
                });
            }
        }
    }

    function handleThirdPartyLogin(e: Event) {
        e.preventDefault();
        console.log('Login with third party');
    }
</script>

<div 
    class="fixed w-full h-full md:w-1/2"
    in:fly={{ y: -1000, duration: animationDuration, easing: quintOut }}
    out:fly={{ y: -1000, duration: animationDuration, easing: quintOut }}
>
    <form class="flex flex-col items-center justify-center w-full h-full gap-3" novalidate>
        <!-- Login card elements -->
        <h2 class="mb-6 titleFont">Log in</h2>
        <span class="spanStyle">
            <input required id="username" type="text" bind:value={username} class="absolute inputField"/>
            <label for="username" class="absolute textFont left-3">Username</label>
        </span>
        <span class="spanStyle">
            <input required id="password" type="{loginPassword}" bind:value={passwordCheck.firstPassword} class="absolute inputField"/>
            <label for="password" class="absolute textFont left-3">Password</label>
            {#if passwordCheck.firstPassword.length !== 0}
                <button aria-label="Show password" class="absolute right-3 hover:scale-125 transition-all cursor-pointer" 
                    onclick={(event) => {
                        event.stopPropagation();
                        loginPassword === 'password' ? loginPassword = 'text' : loginPassword = 'password';
                    }}
                    transition:fade={{
                        duration: 200
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                        {#if loginPassword === 'text'}
                            <path 
                                d="M1 1L21 21" 
                                class="stroke-current"
                                transition:draw={{ duration: 100 }}
                            />
                        {/if}
                    </svg>
                </button>
            {/if}
        </span>
        <button class="w-64 transition-all border-2 textFont loginButton h-14 border-main-200 hover:border-orange-300 hover:bg-orange-300 hover:text-main-100" aria-label="Login button" onclick={handleInternalLogin}>
            Log in
        </button>
        {#if buttons.discord || buttons.github || buttons.gitlab || buttons.google} 
            <!-- OAuth login -->
            <OAuthButtonsComponent {buttons} {handleThirdPartyLogin} />
        {/if}
        <!-- Splitter -->
        <div class="flex flex-row items-center justify-center gap-3">
            <div class="bg-main-200 min-w-28 h-0.5"></div>
            <p class="textFont">
                Or
            </p>
            <div class="bg-main-200 min-w-28 h-0.5"></div>
        </div>
        <!-- Button to change card -->
        <div class="flex flex-row items-center gap-1">
            <p class="textFont">Maybe you want to </p>
            <button 
                class="text-orange-400 cursor-pointer textFont"
                onclick={toggleForms}
            >
                sign up
            </button>
        </div>
    </form>
</div>