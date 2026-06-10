<script lang="ts">
    import type { Car } from "$lib/types/car";

    const { car }: { car: Car } = $props();
    const DAY_IN_MS = 24 * 60 * 60 * 1000;
    type DateStatus = "expired" | "warning" | "valid";

    const typeLabel = $derived.by(() => {
        if (!car.type) {
            return "-";
        }
        return car.type.charAt(0).toUpperCase() + car.type.slice(1);
    });

    const parseDate = (value?: string): Date | null => {
        if (!value) {
            return null;
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split("-").map(Number);
            return new Date(year, month - 1, day);
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return new Date(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate(),
        );
    };

    const formatDate = (value?: string): string => {
        const parsedDate = parseDate(value);
        if (!parsedDate) {
            return "-";
        }
        return parsedDate.toISOString().slice(0, 10);
    };

    const getDateStatus = (value?: string): DateStatus | null => {
        const parsedDate = parseDate(value);
        if (!parsedDate) {
            return null;
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (today.getTime() > parsedDate.getTime()) {
            return "expired";
        }

        const daysUntilDate = Math.ceil(
            (parsedDate.getTime() - today.getTime()) / DAY_IN_MS,
        );
        if (daysUntilDate <= 7) {
            return "warning";
        }

        return "valid";
    };

    const insuranceExpiry = $derived(formatDate(car.dates?.insuranceExpiryDate));
    const insuranceStatus = $derived(getDateStatus(car.dates?.insuranceExpiryDate));
    const inspectionExpiry = $derived(
        formatDate(car.dates?.technicalInspectionExpiryDate),
    );
    const inspectionStatus = $derived(
        getDateStatus(car.dates?.technicalInspectionExpiryDate),
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
                <dd class="carCardValue carCardValueWithStatus">
                    <span>{insuranceExpiry}</span>
                    {#if insuranceStatus}
                        <span
                            class={`carCardStatusDot carCardStatusDot--${insuranceStatus}`}
                            aria-hidden="true"
                        ></span>
                    {/if}
                </dd>
            </div>
            <div class="carCardRow">
                <dt class="carCardLabel">Inspection expiry</dt>
                <dd class="carCardValue carCardValueWithStatus">
                    <span>{inspectionExpiry}</span>
                    {#if inspectionStatus}
                        <span
                            class={`carCardStatusDot carCardStatusDot--${inspectionStatus}`}
                            aria-hidden="true"
                        ></span>
                    {/if}
                </dd>
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
