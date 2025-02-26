<script lang="ts">
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { checkPasswords } from '$lib/functions/checkPasswords';

    // Constants
    const animationDuration: number = 400;

    // Actual card
    let loginVisible: boolean = true;

    // Form fields
    let username: string = '';
    let password: string = '';
    let confirmPassword: string = '';

    // First span animation condition
    let firstSpanAnimation: boolean = false;
    let secondOrThirdSpanActive: boolean = false;

    // Function to check if password contain something
    $: if (password || confirmPassword) {
        swapFirstSpanAnimation();
    };

    // Function to toggle between login and register forms
    const toggleForms = () => {
        loginVisible = !loginVisible;
        clearPassword();
    };

    // Function to clear password field
    const clearPassword = () => {
        password = '';
    };

    // Function to swap first span animation boolean
    const swapFirstSpanAnimation = (mouseEvent: string = 'none') => {
        if (password.length > 0 && confirmPassword.length > 0) {
            firstSpanAnimation = true;
        } 

        else if ((mouseEvent === 'confirmaor' && password.length > 0) || (mouseEvent === 'password' && confirmPassword.length > 0)) {
            firstSpanAnimation = true;
        }

        else if (secondOrThirdSpanActive && mouseEvent === 'confirmaor') {
            firstSpanAnimation = true;
        }
        
        else {
            firstSpanAnimation = false;
        };
    };
</script>

<main class="fixed inset-0 flex items-center justify-center overflow-hidden">
    <!-- Page photo -->
    <div class="h-full w-1/2 hidden md:block z-20 shadow-2xl">
        <!-- svelte-ignore a11y_img_redundant_alt -->
        <img src="/loginPagePhoto.jpg" alt="Login page photo" class="object-cover h-full w-full"/>
    </div>
    <div class="h-full w-1/2 flex justify-center items-center">
        {#if loginVisible}
            <!-- Login card -->
            <div 
                class="fixed w-full md:w-1/2 h-full"
                in:fly={{ y: -1000, duration: animationDuration, easing: quintOut }}
                out:fly={{ y: -1000, duration: animationDuration, easing: quintOut }}
            >
                <div class="h-full w-full flex flex-col items-center justify-center gap-3">
                    <!-- Login card elements -->
                    <h2 class="mb-6 titleFont">Log in</h2>
                    <span class="spanStyle">
                        <input required id="username" type="text" bind:value={username} class="inputField absolute"/>
                        <label for="username" class="textFont absolute left-3">Username</label>
                    </span>
                    <span class="spanStyle">
                        <input required id="password" type="text" bind:value={password} class="inputField absolute"/>
                        <label for="password" class="textFont absolute left-3">Password</label>
                    </span>
                    <button class="textFont loginButton w-64 h-14 border-2 border-main-200 hover:border-orange-300 hover:bg-orange-300 hover:text-main-100 transition-all" aria-label="Login button">
                        Log in
                    </button>
                    <!-- Forgot password button -->
                    <div class="flex-row items-center gap-1 hidden">
                        <p class="textFont">Maybe you want to </p>
                        <button 
                            class="textFont text-orange-400 cursor-pointer"
                            on:click={toggleForms}
                        >
                            sign in
                        </button>
                    </div>
                    <!-- OAuth login -->
                    <div class="grid grid-cols-[repeat(auto-fit,_minmax(0,_1fr))] gap-2 w-64 h-16">
                        <button class="loginButton bg-[#7289da]" aria-label="Login with OAuth - Discord">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M524.5 69.8a1.5 1.5 0 0 0 -.8-.7A485.1 485.1 0 0 0 404.1 32a1.8 1.8 0 0 0 -1.9 .9 337.5 337.5 0 0 0 -14.9 30.6 447.8 447.8 0 0 0 -134.4 0 309.5 309.5 0 0 0 -15.1-30.6 1.9 1.9 0 0 0 -1.9-.9A483.7 483.7 0 0 0 116.1 69.1a1.7 1.7 0 0 0 -.8 .7C39.1 183.7 18.2 294.7 28.4 404.4a2 2 0 0 0 .8 1.4A487.7 487.7 0 0 0 176 479.9a1.9 1.9 0 0 0 2.1-.7A348.2 348.2 0 0 0 208.1 430.4a1.9 1.9 0 0 0 -1-2.6 321.2 321.2 0 0 1 -45.9-21.9 1.9 1.9 0 0 1 -.2-3.1c3.1-2.3 6.2-4.7 9.1-7.1a1.8 1.8 0 0 1 1.9-.3c96.2 43.9 200.4 43.9 295.5 0a1.8 1.8 0 0 1 1.9 .2c2.9 2.4 6 4.9 9.1 7.2a1.9 1.9 0 0 1 -.2 3.1 301.4 301.4 0 0 1 -45.9 21.8 1.9 1.9 0 0 0 -1 2.6 391.1 391.1 0 0 0 30 48.8 1.9 1.9 0 0 0 2.1 .7A486 486 0 0 0 610.7 405.7a1.9 1.9 0 0 0 .8-1.4C623.7 277.6 590.9 167.5 524.5 69.8zM222.5 337.6c-29 0-52.8-26.6-52.8-59.2S193.1 219.1 222.5 219.1c29.7 0 53.3 26.8 52.8 59.2C275.3 311 251.9 337.6 222.5 337.6zm195.4 0c-29 0-52.8-26.6-52.8-59.2S388.4 219.1 417.9 219.1c29.7 0 53.3 26.8 52.8 59.2C470.7 311 447.5 337.6 417.9 337.6z"/></svg>
                        </button>
                        <button class="loginButton bg-white" aria-label="Login with OAuth - Google">
                            <svg width="800px" height="800px" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>
                        </button>
                        <button class="loginButton bg-[#24292e]" aria-label="Login with OAuth - Github">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3 .3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5 .3-6.2 2.3zm44.2-1.7c-2.9 .7-4.9 2.6-4.6 4.9 .3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3 .7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3 .3 2.9 2.3 3.9 1.6 1 3.6 .7 4.3-.7 .7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3 .7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3 .7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"/></svg>
                        </button>
                        <button class="loginButton bg-[#FC6D27]" aria-label="Login with OAuth - Gitlab">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M503.5 204.6L502.8 202.8L433.1 21C431.7 17.5 429.2 14.4 425.9 12.4C423.5 10.8 420.8 9.9 417.9 9.6C415 9.3 412.2 9.7 409.5 10.7C406.8 11.7 404.4 13.3 402.4 15.5C400.5 17.6 399.1 20.1 398.3 22.9L351.3 166.9H160.8L113.7 22.9C112.9 20.1 111.5 17.6 109.6 15.5C107.6 13.4 105.2 11.7 102.5 10.7C99.9 9.7 97 9.3 94.1 9.6C91.3 9.9 88.5 10.8 86.1 12.4C82.8 14.4 80.3 17.5 78.9 21L9.3 202.8L8.5 204.6C-1.5 230.8-2.7 259.6 5 286.6C12.8 313.5 29.1 337.3 51.5 354.2L51.7 354.4L52.3 354.8L158.3 434.3L210.9 474L242.9 498.2C246.6 500.1 251.2 502.5 255.9 502.5C260.6 502.5 265.2 500.1 268.9 498.2L300.9 474L353.5 434.3L460.2 354.4L460.5 354.1C482.9 337.2 499.2 313.5 506.1 286.6C514.7 259.6 513.5 230.8 503.5 204.6z"/></svg>
                        </button>
                    </div>
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
                            class="textFont text-orange-400 cursor-pointer"
                            on:click={toggleForms}
                        >
                            sign up
                        </button>
                    </div>
                </div>
            </div>
        {:else}
            <!-- Register card -->
            <div 
                class="fixed w-full md:w-1/2 h-full"
                in:fly={{ y: 1000, duration: animationDuration, easing: quintOut }}
                out:fly={{ y: 1000, duration: animationDuration, easing: quintOut }}
            >
                <div class="h-full flex flex-col items-center justify-center gap-3">
                    <!-- Register card elements -->
                    <h2 class="mb-12 titleFont">Register</h2>
                    <span class="spanStyle" style:transform={firstSpanAnimation ? 'translateY(-20px)' : 'none'}>
                        <input required id="username" type="text" bind:value={username} class="inputField"/>
                        <label for="username" class="textFont absolute left-3">Username</label>
                    </span>

                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <span class="spanStyle"
                        on:mouseenter={() => swapFirstSpanAnimation('password')}
                        on:mouseleave={() => swapFirstSpanAnimation('none')}    
                        on:focus={() => secondOrThirdSpanActive = true}
                        on:blur={() => secondOrThirdSpanActive = false}
                    >
                        <input required id="password" type="text" bind:value={password} class="inputField"/>
                        <label for="password" class="textFont absolute left-3">Password</label>
                    </span>

                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <span class="spanStyle"
                        on:mouseenter={() => swapFirstSpanAnimation('confirmaor')}
                        on:mouseleave={() => swapFirstSpanAnimation('none')}
                        on:focus={() => secondOrThirdSpanActive = true}
                        on:blur={() => secondOrThirdSpanActive = false}
                    >
                        <input required id="confirmPassword" type="text" bind:value={confirmPassword} class="inputField"/>
                        <label for="confirmPassword" class="textFont absolute left-3">Confirm password</label>
                    </span>
                    <button class="textFont loginButton w-64 h-14 border-2 border-main-200 hover:border-orange-300 hover:bg-orange-300 hover:text-main-100 transition-all" aria-label="Login button">
                        Register
                    </button>
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
                            class="textFont text-orange-400 cursor-pointer"
                            on:click={toggleForms}
                        >
                            sign in
                        </button>
                    </div>
                </div>
            </div>
        {/if}
    </div>
</main>