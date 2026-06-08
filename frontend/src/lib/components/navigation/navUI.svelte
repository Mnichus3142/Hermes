<script lang="ts">
    import ProfileMenu from "./profileMenu.svelte";
    import NavContent from "./navContent.svelte";

    let { isLoggedIn = false } = $props();
</script>

<div class="navUI">
    {#if isLoggedIn}
        <div class="nav-content">
            <NavContent {isLoggedIn} />
        </div>
    {/if}

    <div class="bar">
        <ProfileMenu/>
    </div>
</div>
