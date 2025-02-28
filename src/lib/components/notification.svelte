<script lang="ts">
    import { notifications } from "$lib/logic/notificationLogic.svelte";
    import { fly } from "svelte/transition";
    import { quintOut } from "svelte/easing";

    const animationDuration = 300;
</script>

<main class='max-h-svh max-w-svw'>
    <div class="absolute bottom-0 right-0 z-30 flex flex-col justify-end p-4 bg-blue-400 h-fit">
        {#each $notifications as notification}
            <div class="p-2 m-1 transition-all bg-red-500 rounded min-w-80 h-fit"
                in:fly={{ y: 1000, duration: animationDuration, easing: quintOut }}
                out:fly={{ y: 1000, duration: animationDuration, easing: quintOut }}
            >
                {JSON.stringify(notification.getTitle())}
            </div>
        {/each}
    </div>
</main>
