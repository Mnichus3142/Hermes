<script lang="ts">
    import { fade } from 'svelte/transition';
    let { carInfo } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6" in:fade={{ duration: 200 }}>
    <!-- Main Info -->
<div class="box">
        <h3 class="mb-4 text-xl font-bold gradientText w-fit">Vehicle Information</h3>
        <div class="space-y-3">
            <div class="element">
                <span class="">VIN</span>
                <span class="font-mono">{carInfo.VIN || 'N/A'}</span>
            </div>
            <div class="element">
                <span class="">Year</span>
                <span>{carInfo.year}</span>
            </div>
            <div class="element">
                <span class="">Type</span>
                <span class="capitalize">{carInfo.type}</span>
            </div>
            <div class="element">
                <span class="">Mileage</span>
                <span>{carInfo.mileage} km</span>
            </div>
        </div>
    </div>

    <!-- Status -->
    <div class="box">
        <h3 class="text-xl font-bold text-secondaryAccent/80 mb-4">Status & Validity</h3>
        <div class="space-y-4">
            <div class="element">
                <span class="">Insurance</span>
                {#if carInfo.insuranceValidUntil && new Date(carInfo.insuranceValidUntil) > new Date()}
                    <span class="validationLabel validationRight">Valid until {new Date(carInfo.insuranceValidUntil).toLocaleDateString()}</span>
                {:else}
                    <span class="validationLabel validationExpired">Expired or Missing</span>
                {/if}
            </div>
            <div class="element">
                <span class="">Inspection</span>
                {#if carInfo.technicalInspectionValidUntil && new Date(carInfo.technicalInspectionValidUntil) > new Date()}
                    <span class="validationLabel validationRight">Valid until {new Date(carInfo.technicalInspectionValidUntil).toLocaleDateString()}</span>
                {:else}
                    <span class="validationLabel validationExpired">Expired or Missing</span>
                {/if}
            </div>
        </div>

        <h3 class="text-xl font-bold text-secondaryAccent/80 mt-8 mb-4">Specifications</h3>
        <div class="space-y-3">
            <div class="element">
                <span class="">Engine</span>
                <span>{carInfo.engineCapacity ? `${carInfo.engineCapacity} cm³` : 'N/A'}</span>
            </div>
            <div class="element">
                <span class="">Fuel</span>
                <span>{carInfo.fuelType || 'N/A'}</span>
            </div>
            <div class="element">
                <span class="">Power / Torque</span>
                <span>{carInfo.power ? `${carInfo.power} HP` : '-'} / {carInfo.torque ? `${carInfo.torque} Nm` : '-'}</span>
            </div>
             <div class="element">
                <span class="">Transmission</span>
                <span>{carInfo.transmissionType || 'N/A'} {carInfo.gears ? `(${carInfo.gears} gears)` : ''}</span>
            </div>
        </div>
    </div>
</div>
