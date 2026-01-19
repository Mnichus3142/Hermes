<script lang="ts">
    /**
     * Schematic representation of a car for highlighting repair sections.
     */
    let { subCategory } = $props();

    // Map common subcategories to SVG part IDs or Classes
    // Valid categories: ENGINE, SUSPENSION, BRAKES, TIRES, BODY, ELECTRONICS, INTERIOR, GLASS, FLUIDS, EXHAUST
    
    const getClass = (target: string) => {
        const isActive = subCategory?.toUpperCase() === target;
        return isActive 
            ? "fill-red-500 stroke-red-600 animate-pulse duration-1000" 
            : "fill-gray-700 stroke-gray-600 hover:fill-gray-600 transition-colors";
    };
</script>

<div class="grid grid-cols-2 gap-8 w-full h-full p-4">
    <!-- TOP VIEW -->
    <div class="aspect-square relative flex items-center justify-center border border-gray-800 rounded bg-gray-900/30">
        <svg viewBox="0 0 200 400" class="h-full w-auto drop-shadow-xl">
            <!-- Chassis -->
            <path d="M40,60 C40,20 160,20 160,60 L160,340 C160,380 40,380 40,340 Z" class="fill-gray-800 stroke-mainBorder stroke-2" />
            
            <!-- Engine/Hood (Front) -->
            <path d="M45,65 L155,65 L155,120 L45,120 Z" class={getClass('ENGINE')} />
             <text x="100" y="95" text-anchor="middle" class="text-[10px] fill-white opacity-50 pointer-events-none">ENGINE</text>

            <!-- Windshield (Glass) -->
            <path d="M45,125 L155,125 L150,160 L50,160 Z" class={getClass('GLASS')} />

            <!-- Roof (Body/Interior) -->
            <path d="M50,165 L150,165 L150,260 L50,260 Z" class={getClass('BODY')} />
            
            <!-- Rear Window (Glass) -->
            <path d="M50,265 L150,265 L155,290 L45,290 Z" class={getClass('GLASS')} />

            <!-- Trunk (Body) -->
            <path d="M45,295 L155,295 L155,340 L45,340 Z" class={getClass('BODY')} />
            
            <!-- Wheels (Tires/Brakes/Suspension) -->
            <rect x="20" y="80" width="20" height="40" rx="5" class={getClass('TIRES')} />
            <rect x="160" y="80" width="20" height="40" rx="5" class={getClass('TIRES')} />
            <rect x="20" y="280" width="20" height="40" rx="5" class={getClass('TIRES')} />
            <rect x="160" y="280" width="20" height="40" rx="5" class={getClass('TIRES')} />
        </svg>
        <div class="absolute bottom-2 left-0 right-0 text-center text-xs opacity-50">TOP VIEW</div>
    </div>

    <!-- SIDE VIEW -->
    <div class="aspect-square relative flex items-center justify-center border border-gray-800 rounded bg-gray-900/30">
        <svg viewBox="0 0 400 200" class="w-full h-auto drop-shadow-xl">
             <!-- Body -->
             <path d="M50,120 L100,120 L130,80 L280,80 L320,120 L380,120 L380,160 L50,160 Z" class={getClass('BODY')} />
             
             <!-- Windows (Glass) -->
             <path d="M140,85 L270,85 L310,120 L130,120 Z" class={getClass('GLASS')} />

             <!-- Wheels (Tires/Brakes/Suspension) -->
             <circle cx="100" cy="160" r="25" class={getClass('TIRES')} />
             <circle cx="330" cy="160" r="25" class={getClass('TIRES')} />
             
             <!-- Brakes (Inner Wheel) -->
             <circle cx="100" cy="160" r="15" class={getClass('BRAKES')} />
             <circle cx="330" cy="160" r="15" class={getClass('BRAKES')} />
             
             <!-- Suspension (Above Wheels) -->
             <rect x="90" y="130" width="20" height="15" class={getClass('SUSPENSION')} />
             <rect x="320" y="130" width="20" height="15" class={getClass('SUSPENSION')} />

             <!-- Exhaust -->
             <rect x="30" y="150" width="20" height="10" class={getClass('EXHAUST')} />
             
             <!-- Lights (Electronics) -->
             <path d="M370,130 L380,130 L380,140 L370,140 Z" class={getClass('ELECTRONICS')} />
             <path d="M50,135 L60,135 L60,145 L50,145 Z" class="fill-red-800" /> 
        </svg>
         <div class="absolute bottom-2 left-0 right-0 text-center text-xs opacity-50">SIDE VIEW</div>
    </div>

    <!-- FRONT VIEW -->
    <div class="aspect-square relative flex items-center justify-center border border-gray-800 rounded bg-gray-900/30">
        <svg viewBox="0 0 200 200" class="h-full w-auto drop-shadow-xl">
            <!-- Main Body -->
            <path d="M40,100 L160,100 L160,160 L40,160 Z" class={getClass('BODY')} />
            
            <!-- Windshield -->
             <path d="M50,60 L150,60 L160,100 L40,100 Z" class={getClass('GLASS')} />

             <!-- Grille (Engine cooling) -->
             <rect x="70" y="110" width="60" height="30" rx="5" class={getClass('ENGINE')} />

             <!-- Lights -->
             <circle cx="55" cy="120" r="10" class={getClass('ELECTRONICS')} />
             <circle cx="145" cy="120" r="10" class={getClass('ELECTRONICS')} />
             
             <!-- Tires -->
             <rect x="20" y="120" width="20" height="40" class={getClass('TIRES')} />
             <rect x="160" y="120" width="20" height="40" class={getClass('TIRES')} />
        </svg>
         <div class="absolute bottom-2 left-0 right-0 text-center text-xs opacity-50">FRONT VIEW</div>
    </div>

    <!-- INTERIOR/OTHER -->
    <div class="aspect-square relative flex items-center justify-center border border-gray-800 rounded bg-gray-900/30">
        <div class="text-center">
             <div class="text-4xl mb-2">
                {#if subCategory === 'INTERIOR'}💺
                {:else if subCategory === 'FLUIDS'}💧
                {:else if subCategory === 'ELECTRONICS'}⚡
                {:else}🔧{/if}
             </div>
             <div class="text-sm font-bold text-mainAccent">{subCategory || 'GENERAL'}</div>
             <div class="text-xs opacity-50 mt-1">System View</div>
        </div>
    </div>
</div>
