<script lang="ts">
    import { notifications } from "$lib/logic/notificationLogic.svelte";

    notifications.subscribe((value) => console.log(value))
</script>