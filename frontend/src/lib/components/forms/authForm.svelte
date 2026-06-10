<script lang="ts">
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import LoginForm from "../login/LoginForm.svelte";
    import RegisterForm from "../register/RegisterForm.svelte";
    import type { OAuthButtons } from "$lib/types/OAuthButtons";
    import { createNewNotification } from "$lib/logic/notificationLogic.svelte";

    let pageReady = $state(false);
    let loginVisible = $state(true);

    const animationDuration = 300;

    let buttons = $state<OAuthButtons | undefined>(undefined);

    $effect(() => {
        if (buttons !== undefined) {
            pageReady = true;
        }
    });

    pageReady = true;

    onMount(async () => {
        await getButtons();
        checkForAuthNotification();
    });

    const toggleForms = () => {
        loginVisible = !loginVisible;
    };

    const getButtons = async () => {
        try {
            const response = await fetch("/api/OAuth");
            const data = await response.json();
            buttons = data;
        } catch (error) {
            console.error("Error during fetching buttons:", error);
        }
    };

    const checkForAuthNotification = () => {
        if (!browser) return;

        const authNotificationCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("authNotification="));

        if (authNotificationCookie) {
            try {
                const notificationData = JSON.parse(
                    decodeURIComponent(authNotificationCookie.split("=")[1]),
                );
                createNewNotification(notificationData);

                document.cookie =
                    "authNotification=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            } catch (error) {
                console.error("Error parsing auth notification:", error);
            }
        }
    };
</script>

<div class="authCardWrapper">
    {#if loginVisible}
        <LoginForm
            {toggleForms}
            {animationDuration}
            buttons={buttons || {
                DISCORD: false,
                GOOGLE: false,
                GITHUB: false,
                GITLAB: false,
            }}
        />
    {:else}
        <RegisterForm {toggleForms} {animationDuration} />
    {/if}
</div>
