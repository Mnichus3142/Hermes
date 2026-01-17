<script lang="ts">
    import { fly, fade, slide, draw } from 'svelte/transition';
    import { checkPasswords } from '$lib/functions/checkPasswords';
    import { quintOut } from 'svelte/easing';
    import { clearSpaces } from '$lib/functions/clearSpaces';
    import { createNewNotification } from '$lib/logic/notificationLogic.svelte';
    import { clickOutside } from '$lib/functions/clickOutside';
    import type { checkPasswordsType } from '$lib/types/checkPasswords';
    import PasswordStrengthIndicator from './PasswordStrengthIndicator.svelte';
    
    const { toggleForms, animationDuration } = $props<{
        toggleForms: () => void;
        animationDuration: number;
    }>();

    // Reactive state variables
    let username = $state('');
    let registerPassword = $state('password');
    let registerConfirmation = $state('password');
    let focusedField = $state<string | null>(null);
    let hoveredField = $state<string | null>(null);
    
    // Password checking object
    let passwordCheck = $state<checkPasswordsType>({
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

    // Derived states for animation
    // Password span translation Y
    let passwordY = $derived(
         (focusedField === 'confirm' || hoveredField === 'confirm' || passwordCheck.secondPassword.length > 0) ? -24 : 0
    );

    // Username span translation Y
    // Sum of password's shift PLUS extra shift if password field needs headroom for label
    let usernameY = $derived(
        passwordY + 
        ((focusedField === 'password' || hoveredField === 'password' || passwordCheck.firstPassword.length > 0) ? -24 : 0)
    );
    
    // Title moves together with username to maintain spacing
    let titleY = $derived(usernameY);

    // Logic for PasswordStrengthIndicator
    // It moves up (compacts) when we interact with Confirm Password
    let movePasswordConditions = $derived(
        focusedField === 'confirm' ||
        hoveredField === 'confirm' || 
        passwordCheck.secondPassword.length > 0
    );

    let thirdSpanClicked = $derived(
        focusedField === 'confirm' ||
        hoveredField === 'confirm'
    );
    
    let showPasswordStrength = $derived(
        passwordCheck.firstPassword.length > 0 && !passwordCheck.conditions.allConditionsMet
    );

    // Reactive effects
    $effect(() => {
        username = clearSpaces(username);
    });

    $effect(() => {
        passwordCheck.firstPassword = clearSpaces(passwordCheck.firstPassword);
    });
    
    $effect(() => {
        passwordCheck.secondPassword = clearSpaces(passwordCheck.secondPassword);
    });
    
    // Effect for hiding password
    $effect(() => {
        if (passwordCheck.firstPassword.length === 0) {
            registerPassword = 'password';
        }
    });
    
    $effect(() => {
        if (passwordCheck.secondPassword.length === 0) {
            registerConfirmation = 'password';
        }
    });
    
    // Effect for checking password conditions
    $effect(() => {
        if (passwordCheck.firstPassword.length > 0 || passwordCheck.secondPassword.length > 0) {
            passwordCheck = checkPasswords(passwordCheck);
        }
    });
      
    // Effect for deactivating conditions if password field is empty
    $effect(() => {
        if (passwordCheck.firstPassword === '') {
            passwordCheck.conditions.allConditionsMet = false;
            passwordCheck.conditions.hasAtLeast1LowercaseLetter = false;
            passwordCheck.conditions.hasAtLeast1Number = false;
            passwordCheck.conditions.hasAtLeast1SpecialCharacter = false;
            passwordCheck.conditions.hasAtLeast1UppercaseLetter = false;
            passwordCheck.conditions.isAtLeast8Characters = false;
        }
    });    
    
    // Function handling registration
    async function handleInternalRegistration(e: Event) {
        e.preventDefault();

        if (passwordCheck.firstPassword === '' || username === '' || passwordCheck.secondPassword === '') {
            createNewNotification({
                title: 'Could not register',
                message: 'Password and username cannot be empty',
                type: 'warn',
                duration: 3000
            });
            return;
        }

        else if (passwordCheck.firstPassword !== passwordCheck.secondPassword) {
            createNewNotification({
                title: 'Could not register',
                message: 'Passwords do not match',
                type: 'warn',
                duration: 3000
            });
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
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

            createNewNotification({
                title: data.title,
                message: data.message,
                type: 'success',
                duration: 3000
            });

            // Switch to login form
            toggleForms();
            
            // Clear passwords
            passwordCheck.firstPassword = '';
            passwordCheck.secondPassword = '';
        } catch (error: any) {
            if (error.message !== '409') {
                console.error('Error during registration:', error);
                createNewNotification({
                    title: 'Error during registration',
                    message: error.message || 'There was an unknown error during registration',
                    type: 'error',
                    duration: 3000
                });
            }
        }
    }
</script>

<div 
    class="fixed w-full h-full md:w-1/2"
    in:fly={{ y: 1000, duration: animationDuration, easing: quintOut }}
    out:fly={{ y: 1000, duration: animationDuration, easing: quintOut }}
>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form 
        class="flex flex-col items-center justify-center h-full gap-3" 
        novalidate
        onclick={() => focusedField = null}
    >
        <!-- Register card elements -->
        <h2 
            class="mb-12 titleFont transition-all duration-300"
            style:transform="translateY({titleY}px)"
        >
            Register
        </h2>
        
        <!-- Username Field -->
        <span 
            class="spanStyle" 
            class:has-value={username.length > 0}
            style:transform="translateY({usernameY}px)"
            onclick={(e) => e.stopPropagation()}
            onmouseenter={() => hoveredField = 'username'}
            onmouseleave={() => hoveredField = null}
        >
            <input 
                required 
                id="username" 
                type="text" 
                bind:value={username} 
                class="inputField"
                onfocus={() => focusedField = 'username'}
                onblur={() => focusedField = null}
            />
            <label for="username" class="absolute textFont left-3">Username</label>
        </span>

        <!-- Password Field -->
        <span 
            class="spanStyle" 
            class:has-value={passwordCheck.firstPassword.length > 0}
            style:transform="translateY({passwordY}px)"
            onclick={(e) => e.stopPropagation()}
            onmouseenter={() => hoveredField = 'password'}
            onmouseleave={() => hoveredField = null}
        >
            <input 
                required 
                id="password" 
                type="{registerPassword}" 
                bind:value={passwordCheck.firstPassword} 
                class="inputField"
                onfocus={() => focusedField = 'password'}
                onblur={() => focusedField = null}
            />
            <label for="password" class="absolute textFont left-3">Password</label>
            {#if passwordCheck.firstPassword.length !== 0}
                <button aria-label="Show password" class="absolute right-3 hover:scale-125 transition-all cursor-pointer" 
                    onclick={(event) => {
                        event.stopPropagation();
                        registerPassword === 'password' ? registerPassword = 'text' : registerPassword = 'password';
                    }}
                    transition:fade={{
                        duration: 200
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                        {#if registerPassword === 'text'}
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

        {#if showPasswordStrength}
            <div transition:slide={{ duration: 300 }}>
                <PasswordStrengthIndicator {passwordCheck} {movePasswordConditions} {thirdSpanClicked} />        
            </div>
        {/if}
        
        <!-- Confirm Password Field -->
        <span 
            class="spanStyle" 
            class:has-value={passwordCheck.secondPassword.length > 0}
            onclick={(e) => e.stopPropagation()}
            onmouseenter={() => hoveredField = 'confirm'}
            onmouseleave={() => hoveredField = null}
        >
            <input 
                required 
                id="confirmPassword" 
                type="{registerConfirmation}" 
                bind:value={passwordCheck.secondPassword} 
                class="inputField" 
                onfocus={() => focusedField = 'confirm'}
                onblur={() => focusedField = null}
            />
            <label for="confirmPassword" class="absolute textFont left-3">Confirm password</label>
            {#if passwordCheck.secondPassword.length !== 0}
                <button aria-label="Show password" class="absolute right-3 hover:scale-125 transition-all cursor-pointer pointer-events-auto" 
                    onclick={(event) => {
                        event.stopPropagation();
                        registerConfirmation === 'password' ? registerConfirmation = 'text' : registerConfirmation = 'password';
                    }}
                    transition:fade={{
                        duration: 200
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-eye">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                        <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
                        {#if registerConfirmation === 'text'}
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
        
        {#if !passwordCheck.doPasswordsMatch && passwordCheck.message.length > 0 && passwordCheck.conditions.allConditionsMet}
            <p class="flex justify-center w-64 text-red-500 place-items-center">
                {passwordCheck.message}
            </p>
        {/if}
        
        <button class="w-64 transition-all border-2 textFont loginButton h-14 border-main-200 hover:border-mainGold hover:bg-mainGold hover:text-main-100" aria-label="Register button" onclick={handleInternalRegistration}>
            Register
        </button>
        
        <!-- Splitter -->
        <div class="flex flex-row items-center justify-center gap-3">
            <div class="bg-mainGrey min-w-28 h-0.5"></div>
            <p class="textFont">
                Or
            </p>
            <div class="bg-mainGrey min-w-28 h-0.5"></div>
        </div>
        
        <!-- Button to change card -->
        <div class="flex flex-row items-center gap-1">
            <p class="textFont">Maybe you want to </p>
            <button 
                class="text-mainGold cursor-pointer textFont"
                onclick={toggleForms}
            >
                sign in
            </button>
        </div>
    </form>
</div>