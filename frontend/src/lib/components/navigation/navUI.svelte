<script lang="ts">
    import ProfileMenu from "./profileMenu.svelte";

    let isLoggedIn = true;
</script>

<!-- navUI container -->
<div class="navUI">
    <!-- Top bar container -->
    <div class="topContainer">
        <ProfileMenu {isLoggedIn} />
    </div>
</div>
