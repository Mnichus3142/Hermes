<script lang="ts">
    import type { PageData } from "./$types";

    type DashboardExpense = {
        _id: string;
        amount?: number;
        date?: string;
        category?: string;
        carId?: string;
        fuel?: {
            volume?: number;
        };
    };

    type DashboardCar = {
        _id: string;
        make?: string;
        model?: string;
    };

    type FuelChartPoint = {
        key: string;
        label: string;
        value: number;
    };

    type SpendingChartPoint = {
        key: string;
        label: string;
        value: number;
    };

    type ChartType = "fuel" | "spending";

    let { data }: { data: PageData } = $props();

    let fromDate = $state("");
    let toDate = $state("");
    let activeChart = $state<ChartType | null>(null);
    let isModalExpanded = $state(false);
    let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let modalStartX = $state(0);
    let modalStartY = $state(0);
    let modalStartScaleX = $state(0.94);
    let modalStartScaleY = $state(0.9);

    const expenses = $derived((data.expenses ?? []) as DashboardExpense[]);
    const cars = $derived((data.cars ?? []) as DashboardCar[]);
    const username = $derived(data.username ?? null);

    const chartDateRangeLabel = $derived.by(() => {
        if (!fromDate && !toDate) {
            return "Showing all dates";
        }

        if (fromDate && toDate) {
            return `Showing ${fromDate} to ${toDate}`;
        }

        if (fromDate) {
            return `Showing from ${fromDate}`;
        }

        return `Showing up to ${toDate}`;
    });

    const fuelByMonth = $derived.by(() => aggregateFuelByMonth(expenses));
    const spendingByCar = $derived.by(() => aggregateSpendingByCar(expenses, cars));
    const filteredExpenses = $derived.by(() => getFilteredExpenses(expenses, fromDate, toDate));
    const filteredFuelByMonth = $derived.by(() => aggregateFuelByMonth(filteredExpenses));
    const filteredSpendingByCar = $derived.by(() =>
        aggregateSpendingByCar(filteredExpenses, cars),
    );

    const modalFuelChart = $derived(
        activeChart === "fuel" ? filteredFuelByMonth : [],
    );
    const modalSpendingChart = $derived(
        activeChart === "spending" ? filteredSpendingByCar : [],
    );

    function parseDateInput(value: string, endOfDay = false): number | null {
        if (!value) {
            return null;
        }

        const stamp = new Date(`${value}T00:00:00`).getTime();
        if (!Number.isFinite(stamp)) {
            return null;
        }

        return endOfDay ? stamp + 24 * 60 * 60 * 1000 - 1 : stamp;
    }

    function getFilteredExpenses(
        source: DashboardExpense[],
        from: string,
        to: string,
    ): DashboardExpense[] {
        const fromStamp = parseDateInput(from);
        const toStamp = parseDateInput(to, true);

        return source.filter((expense) => {
            if (!expense.date) {
                return false;
            }
            const expenseStamp = new Date(expense.date).getTime();
            if (!Number.isFinite(expenseStamp)) {
                return false;
            }

            if (fromStamp !== null && expenseStamp < fromStamp) {
                return false;
            }

            if (toStamp !== null && expenseStamp > toStamp) {
                return false;
            }

            return true;
        });
    }

    function monthLabelFromDate(date: Date): string {
        return date.toLocaleDateString("en-US", {
            month: "short",
            year: "2-digit",
        });
    }

    function aggregateFuelByMonth(source: DashboardExpense[]): FuelChartPoint[] {
        const totals = new Map<string, number>();

        for (const expense of source) {
            if (expense.category !== "fuel") {
                continue;
            }

            const fuelVolume = expense.fuel?.volume;
            const expenseDate = expense.date ? new Date(expense.date) : null;
            if (
                typeof fuelVolume !== "number" ||
                !Number.isFinite(fuelVolume) ||
                fuelVolume <= 0 ||
                !expenseDate ||
                Number.isNaN(expenseDate.getTime())
            ) {
                continue;
            }

            const monthKey = `${expenseDate.getFullYear()}-${String(
                expenseDate.getMonth() + 1,
            ).padStart(2, "0")}`;
            totals.set(monthKey, (totals.get(monthKey) ?? 0) + fuelVolume);
        }

        return Array.from(totals.entries())
            .sort(([a], [b]) => (a > b ? 1 : -1))
            .map(([key, value]) => {
                const [year, month] = key.split("-").map(Number);
                const labelDate = new Date(year, month - 1, 1);
                return {
                    key,
                    label: monthLabelFromDate(labelDate),
                    value,
                };
            });
    }

    function aggregateSpendingByCar(
        source: DashboardExpense[],
        availableCars: DashboardCar[],
    ): SpendingChartPoint[] {
        const totals = new Map<string, number>();
        const labels = new Map<string, string>();

        for (const car of availableCars) {
            const makeModel = [car.make, car.model].filter(Boolean).join(" ").trim();
            labels.set(car._id, makeModel || "Unknown car");
        }

        for (const expense of source) {
            if (!expense.carId || typeof expense.amount !== "number") {
                continue;
            }

            if (!Number.isFinite(expense.amount) || expense.amount <= 0) {
                continue;
            }

            totals.set(expense.carId, (totals.get(expense.carId) ?? 0) + expense.amount);

            if (!labels.has(expense.carId)) {
                labels.set(expense.carId, `Car ${expense.carId.slice(-4)}`);
            }
        }

        return Array.from(totals.entries())
            .map(([key, value]) => ({
                key,
                label: labels.get(key) ?? "Unknown car",
                value,
            }))
            .sort((a, b) => b.value - a.value);
    }

    function formatValue(value: number, fractionDigits = 1): string {
        return new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: fractionDigits,
        }).format(value);
    }

    function openChart(chart: ChartType, event: MouseEvent) {
        const card = event.currentTarget as HTMLElement | null;
        const rect = card?.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const targetWidth = Math.min(viewportWidth - 32, 920);
        const targetHeight = Math.min(viewportHeight - 48, 680);

        if (rect) {
            modalStartX = rect.left + rect.width / 2 - viewportWidth / 2;
            modalStartY = rect.top + rect.height / 2 - viewportHeight / 2;
            modalStartScaleX = Math.max(0.3, Math.min(1, rect.width / targetWidth));
            modalStartScaleY = Math.max(0.25, Math.min(1, rect.height / targetHeight));
        } else {
            modalStartX = 0;
            modalStartY = 0;
            modalStartScaleX = 0.92;
            modalStartScaleY = 0.9;
        }

        activeChart = chart;

        if (closeTimeoutId) {
            clearTimeout(closeTimeoutId);
            closeTimeoutId = null;
        }

        requestAnimationFrame(() => {
            isModalExpanded = true;
        });
    }

    function closeChart() {
        isModalExpanded = false;
        closeTimeoutId = setTimeout(() => {
            activeChart = null;
            closeTimeoutId = null;
        }, 280);
    }

    function clearDateFilters() {
        fromDate = "";
        toDate = "";
    }
</script>

<svelte:head>
    <title>Dashboard | Hermes</title>
</svelte:head>

<section class="dashboardPage">
    <div class="dashboardContent">
        <header class="dashboardHeader">
            <p class="dashboardEyebrow">Dashboard</p>
            <h1 class="dashboardTitle">
                Welcome back{username ? `, ${username}` : ""}!
            </h1>
            <p class="dashboardSubtitle">
                Quick overview of fuel usage and car spending.
            </p>
        </header>

        <div class="dashboardCards">
            <div
                class="dashboardCard dashboardCardInteractive"
                role="button"
                tabindex="0"
                onclick={(event) => openChart("fuel", event)}
                onkeydown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openChart("fuel", event as unknown as MouseEvent);
                    }
                }}
            >
                <header class="dashboardCardHeader">
                    <h2 class="dashboardCardTitle">Fuel usage by month</h2>
                    <span class="dashboardCardAction">Open details</span>
                </header>

                {#if fuelByMonth.length === 0}
                    <p class="dashboardEmptyState">No fuel data yet.</p>
                {:else}
                    {@const visibleFuel = fuelByMonth.slice(-6)}
                    {@const maxFuel = Math.max(...visibleFuel.map((item) => item.value), 1)}
                    <div class="dashboardMiniChart" aria-hidden="true">
                        {#each visibleFuel as item (item.key)}
                            <div class="dashboardMiniBarWrap">
                                <div class="dashboardMiniBarTrack">
                                    <div
                                        class="dashboardMiniBarFill"
                                        style={`height: ${(item.value / maxFuel) * 100}%`}
                                    ></div>
                                </div>
                                <p class="dashboardMiniLabel">{item.label}</p>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <div
                class="dashboardCard dashboardCardInteractive"
                role="button"
                tabindex="0"
                onclick={(event) => openChart("spending", event)}
                onkeydown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openChart("spending", event as unknown as MouseEvent);
                    }
                }}
            >
                <header class="dashboardCardHeader">
                    <h2 class="dashboardCardTitle">Money spent by car</h2>
                    <span class="dashboardCardAction">Open details</span>
                </header>

                {#if spendingByCar.length === 0}
                    <p class="dashboardEmptyState">No spending data yet.</p>
                {:else}
                    {@const visibleCars = spendingByCar.slice(0, 4)}
                    {@const maxCarSpend = Math.max(...visibleCars.map((item) => item.value), 1)}
                    <div class="dashboardSpendingMini">
                        {#each visibleCars as item (item.key)}
                            <div class="dashboardSpendingMiniRow">
                                <p class="dashboardSpendingMiniLabel">{item.label}</p>
                                <div class="dashboardSpendingMiniTrack">
                                    <div
                                        class="dashboardSpendingMiniFill"
                                        style={`width: ${(item.value / maxCarSpend) * 100}%`}
                                    ></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</section>

{#if activeChart}
    <div class={`dashboardModalOverlay ${isModalExpanded ? "is-open" : ""}`}>
        <button
            type="button"
            class="dashboardModalBackdrop"
            aria-label="Close dialog"
            onclick={closeChart}
        ></button>
        <div
            class={`dashboardModal ${isModalExpanded ? "is-open" : ""}`}
            style={`--dashboard-modal-start-x: ${modalStartX}px; --dashboard-modal-start-y: ${modalStartY}px; --dashboard-modal-start-scale-x: ${modalStartScaleX}; --dashboard-modal-start-scale-y: ${modalStartScaleY};`}
            role="dialog"
            aria-modal="true"
            aria-label={activeChart === "fuel" ? "Fuel usage chart" : "Spending by car chart"}
        >
            <header class="dashboardModalHeader">
                <div>
                    <h3 class="dashboardModalTitle">
                        {activeChart === "fuel"
                            ? "Fuel usage by month"
                            : "Money spent by car"}
                    </h3>
                    <p class="dashboardModalSubtitle">{chartDateRangeLabel}</p>
                </div>
                <button class="dashboardCloseButton" type="button" onclick={closeChart}>
                    Close
                </button>
            </header>

            <div class="dashboardFilters">
                <label class="dashboardFilterField">
                    <span>From</span>
                    <input type="date" bind:value={fromDate} />
                </label>
                <label class="dashboardFilterField">
                    <span>To</span>
                    <input type="date" bind:value={toDate} />
                </label>
                <button
                    type="button"
                    class="dashboardFilterReset"
                    onclick={clearDateFilters}
                >
                    Reset
                </button>
            </div>

            {#if activeChart === "fuel"}
                {#if modalFuelChart.length === 0}
                    <p class="dashboardModalEmpty">
                        No fuel data in the selected date range.
                    </p>
                {:else}
                    {@const modalFuelMax = Math.max(...modalFuelChart.map((item) => item.value), 1)}
                    <div class="dashboardModalBars">
                        {#each modalFuelChart as item (item.key)}
                            <div class="dashboardModalBarWrap">
                                <p class="dashboardModalBarValue">
                                    {formatValue(item.value, 2)} L
                                </p>
                                <div class="dashboardModalBarTrack">
                                    <div
                                        class="dashboardModalBarFill"
                                        style={`height: ${(item.value / modalFuelMax) * 100}%`}
                                    ></div>
                                </div>
                                <p class="dashboardModalBarLabel">{item.label}</p>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}

            {#if activeChart === "spending"}
                {#if modalSpendingChart.length === 0}
                    <p class="dashboardModalEmpty">
                        No spending data in the selected date range.
                    </p>
                {:else}
                    {@const modalSpendingMax = Math.max(...modalSpendingChart.map((item) => item.value), 1)}
                    <div class="dashboardModalSpending">
                        {#each modalSpendingChart as item (item.key)}
                            <div class="dashboardModalSpendingRow">
                                <p class="dashboardModalSpendingLabel">{item.label}</p>
                                <div class="dashboardModalSpendingTrack">
                                    <div
                                        class="dashboardModalSpendingFill"
                                        style={`width: ${(item.value / modalSpendingMax) * 100}%`}
                                    ></div>
                                </div>
                                <p class="dashboardModalSpendingValue">
                                    {formatValue(item.value, 2)} PLN
                                </p>
                            </div>
                        {/each}
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}
