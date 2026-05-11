<script lang="ts">
    let { isLoggedIn } = $props();

    const routes = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>',
        },
        {
            name: "Garage",
            path: "/garage",
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M300-240v-360h360v360-360H300v360Zm-140 80v-400H39l441-320 440 320H800v400H160Zm80-80h60v-360h360v360h60v-366L480-780 240-606v366Zm120 0h240v-60H360v60Zm0-120h240v-60H360v60Zm0-120h240v-60H360v60Zm120-160q17 0 28.5-11.5T520-680q0-17-11.5-28.5T480-720q-17 0-28.5 11.5T440-680q0 17 11.5 28.5T480-640Z"/></svg>',
        },
        {
            name: "Calculator",
            path: "/calculator",
            icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M320-240h60v-80h80v-60h-80v-80h-60v80h-80v60h80v80Zm200-30h200v-60H520v60Zm0-100h200v-60H520v60Zm44-152 56-56 56 56 42-42-56-58 56-56-42-42-56 56-56-56-42 42 56 56-56 58 42 42Zm-314-70h200v-60H250v60Zm-50 472q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z"/></svg>',
        },
    ];
</script>

{#if isLoggedIn}
    {#each routes as route}
        <a href={route.path} class="nav-link">
            {@html route.icon}
            <p class="text">{route.name}</p>
        </a>
    {/each}
{/if}
