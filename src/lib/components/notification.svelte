<script lang="ts">
    import { notifications, type Notification } from "$lib/logic/notificationLogic.svelte";
    import { fly } from "svelte/transition";
    import { quintInOut } from "svelte/easing";
    import { onMount } from "svelte";

    const animationDuration = 300;
    
    // Aktualizacja co sekundę
    const updateInterval = 100;
    let mounted = true;

    onMount(() => {
        const interval = setInterval(() => {
            if (mounted) {
                notifications.update(n => n);
            }
        }, updateInterval);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    });

    function formatTime(ms: number): string {
        if (ms === 0) return '';
        return `${(ms / 1000).toFixed(1)}s`;
    }

    function calculateProgress(notification: Notification): number {
        if (notification.getDuration() === 0) return 0;
        const remaining = notification.getRemainingTime();
        const total = notification.getDuration();
        return (remaining / total) * 100;
    }
</script>

<main class='max-h-svh max-w-svw'>
    <div class="fixed bottom-0 right-0 z-30 flex flex-col justify-start p-4 h-fit">
        {#each $notifications as notification, index (notification)}
            <!-- Main container -->
            <div class="relative flex p-0 m-1 transition-all bg-main-50 shadow-sm rounded min-w-80 max-w-80 overflow-hidden"
                in:fly={{ y: 1000, duration: animationDuration, easing: quintInOut }}
                out:fly={{ x: 1000, duration: animationDuration, easing: quintInOut }}
            >
                <!-- Colored line -->
                <div class="{notification.getNotificationProperties().color} w-1"></div>
                <!-- Content container -->
                <div class="p-2 flex-1 grid">
                    <!-- Title -->
                    <p class="row-start-1 font-medium text-lg">
                        {notification.getTitle()}
                    </p>
                    <!-- Content -->
                    <p class="row-start-2">
                        {notification.getMessage()}
                    </p>
                </div>
                <!-- Close button with timer -->
                <div class="absolute top-2 right-2">
                    {#if notification.getDuration() > 0}
                        <svg class="absolute -top-0.5 -right-0.5 scale-90" width="28" height="28" viewBox="0 0 28 28">
                            <circle
                                cx="14"
                                cy="14"
                                r="13"
                                fill="none"
                                stroke="#e2e8f0"
                                stroke-width="2"
                            />
                            <circle
                                cx="14"
                                cy="14"
                                r="13"
                                fill="none"
                                stroke="#94a3b8"
                                stroke-width="2"
                                stroke-dasharray={`${2 * Math.PI * 13}`}
                                stroke-dashoffset={`${2 * Math.PI * 13 * (1 - calculateProgress(notification) / 100)}`}
                                transform="rotate(-90 14 14)"
                                style="transition: stroke-dashoffset 0.1s linear;"
                            />
                        </svg>
                    {/if}
                    <button 
                        class="cursor-pointer hover:scale-125 transition-all relative z-10 " 
                        aria-label="Close notification" 
                        on:click={() => {notification.closeNotification()}}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6.21967 7.28033C5.92678 6.98744 5.92678 6.51256 6.21967 6.21967C6.51256 5.92678 6.98744 5.92678 7.28033 6.21967L11.999 10.9384L16.7176 6.2198C17.0105 5.92691 17.4854 5.92691 17.7782 6.2198C18.0711 6.51269 18.0711 6.98757 17.7782 7.28046L13.0597 11.999L17.7782 16.7176C18.0711 17.0105 18.0711 17.4854 17.7782 17.7782C17.4854 18.0711 17.0105 18.0711 16.7176 17.7782L11.999 13.0597L7.28033 17.7784C6.98744 18.0713 6.51256 18.0713 6.21967 17.7784C5.92678 17.4855 5.92678 17.0106 6.21967 16.7177L10.9384 11.999L6.21967 7.28033Z" fill="#323544"/>
                        </svg>
                    </button>
                </div>
            </div>
        {/each}
    </div>
</main>
