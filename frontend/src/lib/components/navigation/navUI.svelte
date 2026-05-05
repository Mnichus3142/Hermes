<script lang="ts">
    import ProfileMenu from "./profileMenu.svelte";

    let isLoggedIn = $state(true);
</script>

<!-- navUI container -->
<div class="navUI">
    <!-- Navigation content -->
    <div></div>
    <!-- Bar container -->
    <div class="bar">
        <ProfileMenu {isLoggedIn} />
    </div>
</div>
