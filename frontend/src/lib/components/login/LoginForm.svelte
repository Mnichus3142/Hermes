<script lang="ts">
    import { fly, draw, fade } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import type { OAuthButtons as OAuthButtonsType } from "$lib/types/OAuthButtons";
    import OAuthButtons from "./OAuthButtons.svelte";
    import type { checkPasswordsType } from "$lib/types/checkPasswords";
    import { createNewNotification } from "$lib/logic/notificationLogic.svelte";
    import { isLoggedIn, loginVisible } from "$lib/store/store";
    import { enhance } from "$app/forms";

    const { toggleForms, animationDuration, buttons } = $props<{
        toggleForms: () => void;
        animationDuration: number;
        buttons: OAuthButtonsType;
    }>();

    let username = $state("");
    let loginPassword = $state("password");
    let focusedField = $state<string | null>(null);
    let hoveredField = $state<string | null>(null);

    let passwordCheck: checkPasswordsType = $state({
        doPasswordsMatch: false,
        firstPassword: "",
        secondPassword: "",
        message: "",
        conditions: {
            isAtLeast8Characters: false,
            hasAtLeast1UppercaseLetter: false,
            hasAtLeast1LowercaseLetter: false,
            hasAtLeast1Number: false,
            hasAtLeast1SpecialCharacter: false,
            allConditionsMet: false,
        },
    });

    let usernameY = $derived(
        focusedField === "password" ||
            hoveredField === "password" ||
            passwordCheck.firstPassword.length > 0
            ? -24
            : 0,
    );

    let titleY = $derived(
        usernameY +
            (focusedField === "username" ||
            hoveredField === "username" ||
            username.length > 0
                ? -24
                : 0),
    );

    const notificationTimeout = 5000;

    async function handleInternalLogin(e: Event) {
        e.preventDefault();

        if (passwordCheck.firstPassword === "" || username === "") {
            createNewNotification({
                title: "Could not log in",
                message: "Password and username cannot be empty",
                type: "error",
                duration: notificationTimeout,
            });

            return 0;
        }
        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    password: passwordCheck.firstPassword,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                createNewNotification({
                    title: data.title,
                    message: data.message,
                    type: "error",
                    duration: notificationTimeout,
                });
                throw new Error("409");
            } else {
                createNewNotification({
                    title: data.title,
                    message: data.message,
                    type: "success",
                    duration: notificationTimeout,
                });

                const redirectPath = document.cookie
                    .split("; ")
                    .find((row) => row.startsWith("redirectAfterLogin="))
                    ?.split("=")[1];

                if (redirectPath) {
                    document.cookie =
                        "redirectAfterLogin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }

                isLoggedIn.set(true);
                loginVisible.set(false);

                window.location.href = redirectPath
                        ? decodeURIComponent(redirectPath)
                        : "/dashboard";
            }
        } catch (error: any) {
            if (error.message !== "409") {
                console.error("Error during logging in:", error);
                createNewNotification({
                    title: "Error during logging in",
                    message:
                        error.message ||
                        "There was an unknown error during logging in",
                    type: "error",
                    duration: notificationTimeout,
                });
            }
        }
    }

    function handleThirdPartyLogin(e: Event) {
        e.preventDefault();
        console.log("Login with third party");
    }
</script>

<div
    in:fly={{
        y: -1000,
        duration: animationDuration,
        easing: quintOut,
        delay: animationDuration,
    }}
    out:fly={{ y: -1000, duration: animationDuration, easing: quintOut }}
    class="authCard"
>
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <form novalidate onclick={() => (focusedField = null)}>
        <!-- Login card elements -->
        <h2 class="title" style:transform="translateY({titleY}px)">Log in</h2>
        <!-- Username Field -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
            class="spanStyle"
            class:has-value={username.length > 0}
            style:transform="translateY({usernameY}px)"
            onclick={(e) => e.stopPropagation()}
            onmouseenter={() => (hoveredField = "username")}
            onmouseleave={() => (hoveredField = null)}
        >
            <input
                required
                id="username"
                type="text"
                bind:value={username}
                class="inputField"
                onfocus={() => (focusedField = "username")}
                onblur={() => (focusedField = null)}
            />
            <label for="username">Username</label>
        </span>

        <!-- Password Field -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <span
            class="spanStyle"
            class:has-value={passwordCheck.firstPassword.length > 0}
            onclick={(e) => e.stopPropagation()}
            onmouseenter={() => (hoveredField = "password")}
            onmouseleave={() => (hoveredField = null)}
        >
            <input
                required
                id="password"
                type={loginPassword}
                bind:value={passwordCheck.firstPassword}
                class="inputField"
                onfocus={() => (focusedField = "password")}
                onblur={() => (focusedField = null)}
            />
            <label for="password">Password</label>
            {#if passwordCheck.firstPassword.length !== 0}
                <button
                    aria-label="Show password"
                    onclick={(event) => {
                        event.stopPropagation();
                        loginPassword === "password"
                            ? (loginPassword = "text")
                            : (loginPassword = "password");
                    }}
                    transition:fade={{
                        duration: 200,
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="icon icon-tabler icons-tabler-outline icon-tabler-eye"
                    >
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
                        <path
                            d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6"
                        />
                        {#if loginPassword === "text"}
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
        {#if buttons.DISCORD || buttons.GITHUB || buttons.GITLAB || buttons.GOOGLE}
            <!-- OAuth login -->
            <OAuthButtons {buttons} {handleThirdPartyLogin} />
        {/if}
        <button
            aria-label="Login button"
            onclick={handleInternalLogin}
            class="loginButton primaryButton"
        >
            Log in
        </button>
        <!-- Splitter -->
        <div class="splitter">
            <div></div>
            <p>Or</p>
            <div></div>
        </div>
        <!-- Button to change card -->
        <div class="changeCard">
            <p>Maybe you want to</p>
            <button onclick={toggleForms}> sign up </button>
        </div>
    </form>
</div>
