<script lang="ts">
    import { fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';

    let loginVisible: boolean = true;

    function toggleForms() {
        loginVisible = !loginVisible;
    }
</script>

<main class="fixed inset-0 flex items-center justify-center overflow-hidden">
    {#if loginVisible}
        <!-- Login card -->
        <div 
            class="fixed w-full h-full bg-white"
            in:fly={{ y: -1000, duration: 800, easing: quintOut }}
            out:fly={{ y: -1000, duration: 800, easing: quintOut }}
        >
            <div class="h-full flex flex-col items-center justify-center">
                <!-- Login card elements -->
                <h2 class="mb-8 titleFont">Log in</h2>
                <span class="spanStyle">
                    <input id="username" type="text" class="inputField absolute"/>
                    <label for="username" class="textFont absolute left-3">Username</label>
                </span>
                <button 
                    class="textFont"
                    on:click={toggleForms}
                >
                    Sign up
                </button>
            </div>
        </div>
    {:else}
        <!-- Register card -->
        <div 
            class="fixed w-full h-full bg-gray-100"
            in:fly={{ y: 1000, duration: 800, easing: quintOut }}
            out:fly={{ y: 1000, duration: 800, easing: quintOut }}
        >
            <div class="h-full flex flex-col items-center justify-center">
                <!-- Register card elements -->
                <h2 class="mb-8 titleFont">Register</h2>
                <button 
                    class=""
                    on:click={toggleForms}
                >
                    Sign in
                </button>
            </div>
        </div>
    {/if}
</main>