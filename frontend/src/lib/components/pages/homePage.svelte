<script lang="ts">
    import AuthForm from "../forms/authForm.svelte";
    import { loginVisible } from "$lib/store/store";
    import { quintOut } from "svelte/easing";
    import { fly } from "svelte/transition";
</script>

{#if $loginVisible}
    <div
        in:fly={{
            y: -1000,
            duration: 300,
            easing: quintOut,
        }}
        out:fly={{ y: -1000, duration: 300, easing: quintOut }}
    >
        <button
            title="Profile button"
            class="closeButton"
            onclick={() => loginVisible.set(false)}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#e3e3e3"
                ><path
                    d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                /></svg
            >
        </button>
        <div class="authForm">
            <AuthForm />
        </div>
    </div>
{/if}
