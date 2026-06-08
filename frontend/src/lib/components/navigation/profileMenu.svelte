<script lang="ts">
    import { slide } from "svelte/transition";
    import { clickOutside } from "$lib/functions/clickOutside";
    import { loginVisible, isLoggedIn } from "$lib/store/store";
    import { createNewNotification } from "$lib/logic/notificationLogic.svelte";

    let menuOpen = $state(false);

    const options = [
        {
            label: "Profile",
            action: () => console.log("Go to profile"),
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-240q-56 0-107 17.5T280-170v10h400v-10q-42-35-93-52.5T480-240Zm129-59q60 21 111 59v-560H240v560q51-38 111-59t129-21q69 0 129 21ZM437.5-497.5Q420-515 420-540t17.5-42.5Q455-600 480-600t42.5 17.5Q540-565 540-540t-17.5 42.5Q505-480 480-480t-42.5-17.5ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm339-361q41-41 41-99t-41-99q-41-41-99-41t-99 41q-41 41-41 99t41 99q41 41 99 41t99-41Zm-99-99Z"/></svg>',
        },
        {
            label: "Settings",
            action: () => console.log("Go to settings"),
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>',
        },
        {
            label: "Logout",
            action: async () => await handleLogout(),
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z"/></svg>',
        },
    ];

    const guestOptions = [
        {
            label: "Login",
            action: () => {
                loginVisible.set(true);
                menuOpen = false;
            },
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-120v-80h280v-560H480v-80h280q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H480Zm-80-160-55-58 102-102H120v-80h327L345-622l55-58 200 200-200 200Z"/></svg>',
        },
    ];

    const toggleMenu = () => {
        menuOpen = !menuOpen;
    };

    const slideUp = (node: any, { duration = 300 } = {}) => {
        const height = node.offsetHeight;

        return {
            duration,
            css: (t: any) => `
        clip-path: inset(${(1 - t) * 100}% 0 0 0);
      `,
        };
    };

    const getTransition = (node: any, params: any) => {
        if (window.innerWidth < 768) {
            return slideUp(node, params);
        } else {
            return slide(node, params);
        }
    };

    async function handleLogout() {
        try {
            const response = await fetch("/api/logout", {
                method: "POST",
                credentials: "include",
            });

            console.log(response)

            if (!response.ok) {
                throw new Error("Logout failed");
            }

            isLoggedIn.set(false);
            createNewNotification({
                title: "Logout successful",
                message: "You have been logged out",
                type: "success",
                duration: 3000,
            });

            window.location.href = "/";
        } catch (error) {
            console.error("Logout error:", error);
            createNewNotification({
                title: "Logout failed",
                message: "Error during logout",
                type: "error",
                duration: 5000,
            });
        }
    }
</script>

<!-- Icon and corresponding menu -->
<div class="profileMenu">
    <button title="Profile button" onclick={toggleMenu}>
        <svg
            width="46"
            height="46"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
        </svg>
    </button>

    {#if menuOpen}
        <div
            class="menu"
            transition:getTransition={{ duration: 200 }}
            use:clickOutside
            onclick_outside={(e: Event) => {
                if (
                    e.target instanceof HTMLElement &&
                    !e.target.closest(".profileMenu")
                ) {
                    menuOpen = false;
                }
            }}
        >
            {#if $isLoggedIn}
                {#each options as option}
                    <button onclick={option.action} class="menuItem"
                        ><p>{option.label}</p>
                        {@html option.icon}</button
                    >
                {/each}
            {:else}
                <button onclick={guestOptions[0].action} class="menuItem">
                    <p>{guestOptions[0].label}</p>
                    {@html guestOptions[0].icon}
                </button>
            {/if}
        </div>
    {/if}
</div>
