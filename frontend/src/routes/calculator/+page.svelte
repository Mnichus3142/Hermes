<script lang="ts">
    const numberFormatter = new Intl.NumberFormat("pl-PL", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    let distanceKm = $state<number | undefined>(undefined);
    let fuelLiters = $state<number | undefined>(undefined);
    let fuelPrice = $state<number | undefined>(undefined);

    const areRequiredInputsValid = $derived(
        typeof distanceKm === "number" &&
            distanceKm > 0 &&
            typeof fuelLiters === "number" &&
            fuelLiters > 0
    );

    const isFuelPriceProvided = $derived(typeof fuelPrice === "number");
    const isFuelPriceValid = $derived(
        !isFuelPriceProvided || (typeof fuelPrice === "number" && fuelPrice > 0)
    );

    const consumptionPer100Km = $derived(
        areRequiredInputsValid && distanceKm !== undefined && fuelLiters !== undefined
            ? (fuelLiters / distanceKm) * 100
            : null
    );
    const costPer100Km = $derived(
        consumptionPer100Km !== null &&
            isFuelPriceProvided &&
            isFuelPriceValid &&
            fuelPrice !== undefined
            ? consumptionPer100Km * fuelPrice
            : null
    );
    const totalTripCost = $derived(
        typeof fuelPrice === "number" && isFuelPriceValid && typeof fuelLiters === "number"
            ? fuelLiters * fuelPrice
            : null
    );

    const validationMessage = $derived.by(() => {
        if (
            distanceKm === undefined &&
            fuelLiters === undefined &&
            fuelPrice === undefined
        ) {
            return "Enter values to calculate fuel consumption.";
        }

        if (!areRequiredInputsValid) {
            return "Distance and fuel used must be greater than 0.";
        }

        if (!isFuelPriceValid) {
            return "Fuel price must be greater than 0 to calculate costs.";
        }

        return null;
    });

    const formatValue = (value: number): string => {
        return numberFormatter.format(value);
    };
</script>

<svelte:head>
    <title>Calculator | Hermes</title>
</svelte:head>

<section class="calculatorPage">
    <div class="calculatorContent">
        <header class="calculatorPageHeader">
            <h1 class="calculatorPageTitle">Fuel Calculator</h1>
            <p class="calculatorPageSubtitle">
                Calculate fuel consumption, cost per 100 km, and total trip cost.
            </p>
        </header>

        <article class="calculatorCard">
            <div class="calculatorFormGrid">
                <label class="calculatorField">
                    <span class="calculatorLabel">Distance (km)</span>
                    <input
                        class="calculatorInput"
                        type="number"
                        min="0"
                        step="0.01"
                        bind:value={distanceKm}
                        placeholder="e.g. 320"
                    />
                </label>

                <label class="calculatorField">
                    <span class="calculatorLabel">Fuel used (L)</span>
                    <input
                        class="calculatorInput"
                        type="number"
                        min="0"
                        step="0.01"
                        bind:value={fuelLiters}
                        placeholder="e.g. 24"
                    />
                </label>

                <label class="calculatorField calculatorFieldWide">
                    <span class="calculatorLabel">Fuel price (PLN/L, optional)</span>
                    <input
                        class="calculatorInput"
                        type="number"
                        min="0"
                        step="0.01"
                        bind:value={fuelPrice}
                        placeholder="e.g. 6.79"
                    />
                </label>
            </div>

            {#if validationMessage}
                <p class="calculatorMessage">{validationMessage}</p>
            {/if}

            {#if consumptionPer100Km !== null && validationMessage === null}
                <div class="calculatorResults">
                    <p class="calculatorResultItem">
                        <span class="calculatorResultLabel">Consumption:</span>
                        <strong class="calculatorResultValue">
                            {formatValue(consumptionPer100Km)} l/100 km
                        </strong>
                    </p>

                    {#if costPer100Km !== null && totalTripCost !== null}
                        <p class="calculatorResultItem">
                            <span class="calculatorResultLabel">Cost per 100 km:</span>
                            <strong class="calculatorResultValue">
                                {formatValue(costPer100Km)} PLN
                            </strong>
                        </p>

                        <p class="calculatorResultItem">
                            <span class="calculatorResultLabel">Total trip cost:</span>
                            <strong class="calculatorResultValue">
                                {formatValue(totalTripCost)} PLN
                            </strong>
                        </p>
                    {/if}
                </div>
            {/if}
        </article>
    </div>
</section>
