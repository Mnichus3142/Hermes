<!-- * Loader * -->

<script lang="ts">
    let firstCircleRotation: Number = 0;
</script>

<main class="w-full h-full flex justify-center items-center bg-background-light dark:bg-background-dark">
    <!-- First ring -->
    <div 
        class="absolute z-10 h-[calc((6/12 * 100%) - 40)] aspect-square rounded-full bg-[conic-gradient(theme(colors.orange.400)_0deg,theme(colors.orange.400)_120deg,transparent_120deg,transparent_360deg)]"
        style="rotate: {firstCircleRotation + `deg`};"
    >
    </div>
    <!-- Second ring -->
    <div 
        class="absolute z-20 h-[calc((6/12 * 100%) - 60)] aspect-square rounded-full bg-red-500"
        style="background: conic-gradient(#3b82f6 0deg, #3b82f6 120deg, transparent 120deg, transparent 360deg); rotate: {firstCircleRotation + `deg`};"    
    >
    </div>
    <!-- Third ring -->
    <div 
        class="absolute h-1/3 aspect-square rounded-full bg-red-500"
        style="background: conic-gradient(#3b82f6 0deg, #3b82f6 120deg, transparent 120deg, transparent 360deg); rotate: {firstCircleRotation + `deg`};"    
    >
    </div>
</main>