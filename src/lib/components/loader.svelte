<!-- * Loader * -->

<script lang="ts">
    import { onMount } from 'svelte';

    // Variables to control the rotation of the circles
    let firstCircleRotation: number = 0;
    let secondCircleRotation: number = 0;
    let thirdCircleRotation: number = 0;

    onMount(() => {
        // Function to animate the circles
        const animate = () => {
            firstCircleRotation += 1;
            secondCircleRotation -= 2;
            thirdCircleRotation += 3;
            requestAnimationFrame(animate);
        };

        // Start the animation
        animate();
    });
</script>

<main class="w-screen h-screen flex justify-center items-center">
    <!-- First ring -->
    <div 
        class="absolute z-10 h-[calc(4/12*100%-20px)] aspect-square rounded-full bg-[conic-gradient(theme(colors.orange.500)_0deg,theme(colors.orange.500)_120deg,transparent_120deg,transparent_360deg)]"
        style="transform: rotate({firstCircleRotation}deg);"
    >
    </div>
    <!-- First white ring -->
    <div 
        class="absolute z-20 h-[calc(4/12*100%-30px)] aspect-square rounded-full bg-white"
    >
    </div>
    <!-- Second ring -->
    <div 
        class="absolute z-20 h-[calc(4/12*100%-40px)] aspect-square rounded-full bg-[conic-gradient(theme(colors.orange.400)_0deg,theme(colors.orange.400)_120deg,transparent_120deg,transparent_360deg)]"
        style="transform: rotate({secondCircleRotation}deg);"
    >
    </div>
    <!-- Second white ring -->
    <div 
        class="absolute z-30 h-[calc(4/12*100%-50px)] aspect-square rounded-full bg-white"
    >
    </div>
    <!-- Third ring -->
    <div 
        class="absolute z-30 h-[calc(4/12*100%-60px)] aspect-square rounded-full bg-[conic-gradient(theme(colors.orange.300)_0deg,theme(colors.orange.300)_120deg,transparent_120deg,transparent_360deg)]"
        style="transform: rotate({thirdCircleRotation}deg);"
    >
    </div>
    <!-- Third white ring -->
    <div 
        class="absolute z-40 h-[calc(4/12*100%-70px)] aspect-square rounded-full bg-white"
    >
    </div>
</main>