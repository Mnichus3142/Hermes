<script lang="ts">
    import type { Car } from "$lib/types/car";

    const { car }: { car: Car } = $props();

    const typeLabel = $derived.by(() => {
        if (!car.type) {
            return "-";
        }
        return car.type.charAt(0).toUpperCase() + car.type.slice(1);
    });

    function formatDate(value?: string): string {
        if (!value) {
            return "-";
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return "-";
        }

        return parsed.toISOString().slice(0, 10);
    }

    const insuranceExpiry = $derived(formatDate(car.dates?.insuranceExpiryDate));
    const inspectionExpiry = $derived(
        formatDate(car.dates?.technicalInspectionExpiryDate),
    );
</script>

{#snippet cardContent()}
    <article class="carCard">
        <div class="carCardHeader">
            <div class="carCardNameWrap">
                <h2 class="carCardTitle">{car.make} {car.model}</h2>
                <p class="carCardYear">{car.year ?? "-"}</p>
            </div>
            <span class="carCardTypeBadge">{typeLabel}</span>
        </div>

        <dl class="carCardList">
            <div class="carCardRow">
                <dt class="carCardLabel">Plate</dt>
                <dd class="carCardValue">{car.registrationNumber ?? "-"}</dd>
            </div>
            <div class="carCardRow">
                <dt class="carCardLabel">Mileage</dt>
                <dd class="carCardValue">
                    {car.mileage !== undefined
                        ? `${car.mileage.toLocaleString()} km`
                        : "-"}
                </dd>
            </div>
            <div class="carCardRow">
                <dt class="carCardLabel">Insurance expiry</dt>
                <dd class="carCardValue">{insuranceExpiry}</dd>
            </div>
            <div class="carCardRow">
                <dt class="carCardLabel">Inspection expiry</dt>
                <dd class="carCardValue">{inspectionExpiry}</dd>
            </div>
        </dl>
    </article>
{/snippet}

{#if car._id}
    <a class="carCardLink" href={`/garage/${car._id}`}>
        {@render cardContent()}
    </a>
{:else}
    {@render cardContent()}
{/if}
