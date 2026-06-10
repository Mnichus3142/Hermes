<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import AddCarForm from "$lib/components/garage/AddCarForm.svelte";
    import { clickOutside } from "$lib/functions/clickOutside";
    import { createNewNotification } from "$lib/logic/notificationLogic.svelte";
    import type { Car } from "$lib/types/car";
    import type { ActionResult } from "@sveltejs/kit";
    import type { PageData } from "./$types";

    type ExpenseCategory = "fuel" | "maintenance";

    type GarageExpense = {
        _id: string;
        amount?: number;
        date?: string;
        category: ExpenseCategory;
        description?: string;
        mileageAtExpense?: number;
        fuel?: {
            type?: string;
            volume?: number;
            pricePerUnit?: number;
        };
        maintenanceWorks?: Array<{
            type?: string;
            description?: string;
            amount?: number;
        }>;
    };

    type FuelExpenseDraft = {
        expenseId?: string;
        date: string;
        description: string;
        mileageAtExpense: string;
        fuelVolume: string;
        fuelPricePerUnit: string;
    };

    type MaintenanceExpenseDraft = {
        expenseId?: string;
        amount: string;
        date: string;
        description: string;
        mileageAtExpense: string;
        maintenanceType: string;
    };
    type DateStatus = "expired" | "warning" | "valid";

    let { data }: { data: PageData } = $props();
    const DAY_IN_MS = 24 * 60 * 60 * 1000;

    const car = $derived(data.car as Car);
    const expenses = $derived((data.expenses ?? []) as GarageExpense[]);
    const fuelExpenses = $derived(
        expenses.filter((expense) => expense.category === "fuel"),
    );
    const maintenanceExpenses = $derived(
        expenses.filter((expense) => expense.category === "maintenance"),
    );
    const parameters = $derived(data.parameters);

    let showEditCarModal = $state(false);
    let activeExpenseModal = $state<ExpenseCategory | null>(null);
    let expenseModalMode = $state<"create" | "edit">("create");
    let expenseSubmitting = $state(false);

    let fuelExpenseDraft = $state<FuelExpenseDraft>({
        date: "",
        description: "",
        mileageAtExpense: "",
        fuelVolume: "",
        fuelPricePerUnit: "",
    });

    let maintenanceExpenseDraft = $state<MaintenanceExpenseDraft>({
        amount: "",
        date: "",
        description: "",
        mileageAtExpense: "",
        maintenanceType: "",
    });

    const carFuelType = $derived((car.engine?.type ?? "").trim());
    const hasCarFuelType = $derived(Boolean(carFuelType));
    const calculatedFuelAmount = $derived.by(() => {
        const volume = Number(fuelExpenseDraft.fuelVolume);
        const pricePerUnit = Number(fuelExpenseDraft.fuelPricePerUnit);
        if (!Number.isFinite(volume) || !Number.isFinite(pricePerUnit)) {
            return "";
        }

        return (volume * pricePerUnit).toFixed(2);
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

    const getInputDate = (value?: string): string => {
        const formatted = formatDate(value);
        return formatted === "-" ? "" : formatted;
    };

    const formatAmount = (value?: number): string => {
        if (value === undefined || value === null || Number.isNaN(value)) {
            return "-";
        }
        return `${value.toFixed(2)} PLN`;
    };

    const formatCarType = (value?: string): string => {
        if (!value) {
            return "-";
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const insuranceExpiry = $derived(formatDate(car.dates?.insuranceExpiryDate));
    const insuranceStatus = $derived(getDateStatus(car.dates?.insuranceExpiryDate));
    const inspectionExpiry = $derived(
        formatDate(car.dates?.technicalInspectionExpiryDate),
    );
    const inspectionStatus = $derived(
        getDateStatus(car.dates?.technicalInspectionExpiryDate),
    );

    const resetFuelExpenseDraft = () => {
        fuelExpenseDraft = {
            date: "",
            description: "",
            mileageAtExpense: "",
            fuelVolume: "",
            fuelPricePerUnit: "",
        };
    };

    const resetMaintenanceExpenseDraft = () => {
        maintenanceExpenseDraft = {
            amount: "",
            date: "",
            description: "",
            mileageAtExpense: "",
            maintenanceType: "",
        };
    };

    const openCreateExpenseModal = (category: ExpenseCategory) => {
        expenseModalMode = "create";
        if (category === "fuel") {
            resetFuelExpenseDraft();
        } else {
            resetMaintenanceExpenseDraft();
        }
        activeExpenseModal = category;
    };

    const openEditExpenseModal = (expense: GarageExpense) => {
        expenseModalMode = "edit";
        if (expense.category === "fuel") {
            fuelExpenseDraft = {
                expenseId: expense._id,
                date: getInputDate(expense.date),
                description: expense.description ?? "",
                mileageAtExpense:
                    expense.mileageAtExpense === undefined
                        ? ""
                        : String(expense.mileageAtExpense),
                fuelVolume:
                    expense.fuel?.volume === undefined
                        ? ""
                        : String(expense.fuel.volume),
                fuelPricePerUnit:
                    expense.fuel?.pricePerUnit === undefined
                        ? ""
                        : String(expense.fuel.pricePerUnit),
            };
        } else {
            maintenanceExpenseDraft = {
                expenseId: expense._id,
                amount:
                    expense.amount === undefined ? "" : String(expense.amount),
                date: getInputDate(expense.date),
                description: expense.description ?? "",
                mileageAtExpense:
                    expense.mileageAtExpense === undefined
                        ? ""
                        : String(expense.mileageAtExpense),
                maintenanceType: expense.maintenanceWorks?.[0]?.type ?? "",
            };
        }
        activeExpenseModal = expense.category;
    };

    const closeExpenseModal = () => {
        activeExpenseModal = null;
        expenseSubmitting = false;
    };

    const handleExpenseEnhance = (kind: "create" | "update" | "delete") => {
        return () => {
            if (kind !== "delete") {
                expenseSubmitting = true;
            }

            return async ({ result }: { result: ActionResult }) => {
                if (kind !== "delete") {
                    expenseSubmitting = false;
                }

                if (result.type === "success") {
                    const verb =
                        kind === "create"
                            ? "added"
                            : kind === "update"
                              ? "updated"
                              : "deleted";
                    createNewNotification({
                        title: "Expense saved",
                        message: `Expense ${verb} successfully`,
                        type: "success",
                        duration: 3000,
                    });
                    if (kind !== "delete") {
                        closeExpenseModal();
                    }
                    await invalidateAll();
                    return;
                }

                if (result.type === "failure") {
                    const actionLabel =
                        kind === "create"
                            ? "create"
                            : kind === "update"
                              ? "update"
                              : "delete";
                    createNewNotification({
                        title: "Expense request failed",
                        message:
                            (result.data?.message as string) ??
                            `Could not ${actionLabel} expense`,
                        type: "error",
                        duration: 4000,
                    });
                }
            };
        };
    };

    const confirmDeleteCar = (event: SubmitEvent) => {
        if (!window.confirm("Are you sure you want to delete this car?")) {
            event.preventDefault();
        }
    };
</script>

<svelte:head>
    <title>{car.make} {car.model} | Garage</title>
</svelte:head>

<section class="carDetailsPage">
    <nav aria-label="Breadcrumb" class="carDetailsBreadcrumbs">
        <a href="/dashboard" class="carDetailsBreadcrumbLink">Dashboard</a>
        <span aria-hidden="true">/</span>
        <a href="/garage" class="carDetailsBreadcrumbLink">Garage</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{car.make} {car.model}</span>
    </nav>

    <div class="carDetailsTopBar">
        <a href="/garage" class="carDetailsBackLink">
            <span aria-hidden="true">←</span>
            Back to garage
        </a>
    </div>

    <div class="carDetailsLayout">
        <article class="carDetailsMainCard">
            <div class="carDetailsCardHeader">
                <div>
                    <h1 class="carDetailsTitle">{car.make} {car.model}</h1>
                    <p class="carDetailsMeta">
                        {car.year ?? "-"} • {formatCarType(car.type)}
                    </p>
                </div>
                <div class="carDetailsHeaderActions">
                    <button
                        type="button"
                        class="carDetailsActionButton"
                        onclick={() => (showEditCarModal = true)}
                    >
                        Edit car
                    </button>
                    <form method="POST" action="?/deleteCar" onsubmit={confirmDeleteCar}>
                        <button type="submit" class="carDetailsDangerButton">
                            Delete car
                        </button>
                    </form>
                </div>
            </div>

            <div class="carDetailsStatsGrid">
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Mileage</p>
                    <p class="carDetailsStatValue">
                        {car.mileage !== undefined
                            ? `${car.mileage.toLocaleString()} km`
                            : "-"}
                    </p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Plate</p>
                    <p class="carDetailsStatValue">
                        {car.registrationNumber ?? "-"}
                    </p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">VIN</p>
                    <p class="carDetailsStatValue">{car.vin ?? "-"}</p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Color</p>
                    <p class="carDetailsStatValue">{car.color ?? "-"}</p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Insurance expiry</p>
                    <p class="carDetailsStatValue carDetailsStatValueWithStatus">
                        <span>{insuranceExpiry}</span>
                        {#if insuranceStatus}
                            <span
                                class={`carDetailsStatusDot carDetailsStatusDot--${insuranceStatus}`}
                                aria-hidden="true"
                            ></span>
                        {/if}
                    </p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Inspection expiry</p>
                    <p class="carDetailsStatValue carDetailsStatValueWithStatus">
                        <span>{inspectionExpiry}</span>
                        {#if inspectionStatus}
                            <span
                                class={`carDetailsStatusDot carDetailsStatusDot--${inspectionStatus}`}
                                aria-hidden="true"
                            ></span>
                        {/if}
                    </p>
                </div>
            </div>
        </article>

        <aside class="carDetailsSideCard">
            <h2 class="carDetailsSectionTitle">Powertrain</h2>
            <p class="carDetailsMetaPlaceholder" aria-hidden="true">&nbsp;</p>
            <div class="carDetailsStatsGrid">
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Engine type</p>
                    <p class="carDetailsStatValue">{car.engine?.type ?? "-"}</p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Displacement</p>
                    <p class="carDetailsStatValue">
                        {car.engine?.displacement !== undefined
                            ? `${car.engine.displacement} L`
                            : "-"}
                    </p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Horsepower</p>
                    <p class="carDetailsStatValue">
                        {car.engine?.horsepower !== undefined
                            ? `${car.engine.horsepower} HP`
                            : "-"}
                    </p>
                </div>
                <div class="carDetailsStat">
                    <p class="carDetailsStatLabel">Transmission</p>
                    <p class="carDetailsStatValue">
                        {car.transmission?.type ?? "-"}
                        {car.transmission?.gears !== undefined
                            ? ` (${car.transmission.gears})`
                            : ""}
                    </p>
                </div>
            </div>
        </aside>
    </div>

    <section class="expensesSection">
        <div class="expensesHeader">
            <h2 class="expensesTitle">Expenses</h2>
            <div class="expenseHeaderActions">
                <button
                    type="button"
                    class="expenseAddButton"
                    onclick={() => openCreateExpenseModal("fuel")}
                >
                    Add fuel
                </button>
                <button
                    type="button"
                    class="expenseAddButton"
                    onclick={() => openCreateExpenseModal("maintenance")}
                >
                    Add maintenance
                </button>
            </div>
        </div>

        {#snippet expenseCard(expense: GarageExpense)}
            <article class="expenseCard">
                <header class="expenseCardHeader">
                    <span class="expenseBadge">{expense.category}</span>
                    <p class="expenseAmount">{formatAmount(expense.amount)}</p>
                </header>

                <div class="expenseMeta">
                    <p>Date: {formatDate(expense.date)}</p>
                    <p>Description: {expense.description ?? "-"}</p>
                    <p>
                        Mileage:
                        {expense.mileageAtExpense !== undefined
                            ? `${expense.mileageAtExpense.toLocaleString()} km`
                            : "-"}
                    </p>

                    {#if expense.category === "fuel"}
                        <p>Fuel type: {expense.fuel?.type ?? "-"}</p>
                        <p>
                            Volume:
                            {expense.fuel?.volume !== undefined
                                ? `${expense.fuel.volume} L`
                                : "-"}
                        </p>
                        <p>
                            Price per unit:
                            {expense.fuel?.pricePerUnit !== undefined
                                ? `${expense.fuel.pricePerUnit} PLN`
                                : "-"}
                        </p>
                    {/if}

                    {#if expense.category === "maintenance"}
                        <p>
                            Maintenance type:
                            {expense.maintenanceWorks?.[0]?.type ?? "-"}
                        </p>
                    {/if}
                </div>

                <div class="expenseActions">
                    <button
                        type="button"
                        class="expenseGhostButton"
                        onclick={() => openEditExpenseModal(expense)}
                    >
                        Edit
                    </button>
                    <form
                        method="POST"
                        action="?/deleteExpense"
                        use:enhance={handleExpenseEnhance("delete")}
                    >
                        <input type="hidden" name="expenseId" value={expense._id} />
                        <button type="submit" class="expenseDangerButton">
                            Delete
                        </button>
                    </form>
                </div>
            </article>
        {/snippet}

        <div class="expenseColumns">
            <div class="expenseColumn">
                <h3 class="expenseColumnTitle">Fuel</h3>
                {#if fuelExpenses.length === 0}
                    <p class="expenseEmpty">No fuel expenses yet.</p>
                {:else}
                    <div class="expenseList">
                        {#each fuelExpenses as expense (expense._id)}
                            {@render expenseCard(expense)}
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="expenseColumn">
                <h3 class="expenseColumnTitle">Maintenance</h3>
                {#if maintenanceExpenses.length === 0}
                    <p class="expenseEmpty">No maintenance expenses yet.</p>
                {:else}
                    <div class="expenseList">
                        {#each maintenanceExpenses as expense (expense._id)}
                            {@render expenseCard(expense)}
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </section>
</section>

<AddCarForm
    {parameters}
    open={showEditCarModal}
    onClose={() => (showEditCarModal = false)}
    action="?/updateCar"
    mode="edit"
    initialValues={car}
/>

{#if activeExpenseModal}
    <div class="expenseModalOverlay">
        <div
            class="expenseModal"
            use:clickOutside
            onclick_outside={closeExpenseModal}
        >
            <h3 class="expenseModalTitle">
                {expenseModalMode === "create"
                    ? activeExpenseModal === "fuel"
                        ? "Add fuel expense"
                        : "Add maintenance expense"
                    : activeExpenseModal === "fuel"
                      ? "Edit fuel expense"
                      : "Edit maintenance expense"}
            </h3>
            {#if activeExpenseModal === "fuel"}
                <form
                    method="POST"
                    action={
                        expenseModalMode === "create"
                            ? "?/createExpense"
                            : "?/updateExpense"
                    }
                    use:enhance={handleExpenseEnhance(
                        expenseModalMode === "create" ? "create" : "update",
                    )}
                >
                    <input type="hidden" name="category" value="fuel" />
                    {#if expenseModalMode === "edit" && fuelExpenseDraft.expenseId}
                        <input
                            type="hidden"
                            name="expenseId"
                            value={fuelExpenseDraft.expenseId}
                        />
                    {/if}

                    <div class="expenseFormGrid">
                        <div class="expenseField">
                            <label class="expenseLabel" for="fuel-date">Date</label>
                            <input
                                class="expenseInput"
                                id="fuel-date"
                                name="date"
                                type="date"
                                required
                                bind:value={fuelExpenseDraft.date}
                            />
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="fuel-mileageAtExpense">
                                Mileage at expense
                            </label>
                            <input
                                class="expenseInput"
                                id="fuel-mileageAtExpense"
                                name="mileageAtExpense"
                                type="number"
                                min="0"
                                bind:value={fuelExpenseDraft.mileageAtExpense}
                            />
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="fuelType">
                                Fuel type
                            </label>
                            <input
                                class="expenseInput"
                                id="fuelType"
                                type="text"
                                value={carFuelType || "Not set"}
                                disabled
                            />
                            <input type="hidden" name="fuelType" value={carFuelType} />
                            {#if !hasCarFuelType}
                                <p>
                                    Fuel expense cannot be saved because this car has no
                                    engine type. Set car engine type first.
                                </p>
                            {/if}
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="fuelVolume">
                                Fuel volume
                            </label>
                            <input
                                class="expenseInput"
                                id="fuelVolume"
                                name="fuelVolume"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                bind:value={fuelExpenseDraft.fuelVolume}
                            />
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="fuelPricePerUnit">
                                Fuel price per unit
                            </label>
                            <input
                                class="expenseInput"
                                id="fuelPricePerUnit"
                                name="fuelPricePerUnit"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                bind:value={fuelExpenseDraft.fuelPricePerUnit}
                            />
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="fuel-calculated-amount">
                                Amount (calculated)
                            </label>
                            <input
                                class="expenseInput"
                                id="fuel-calculated-amount"
                                type="text"
                                value={calculatedFuelAmount
                                    ? `${calculatedFuelAmount} PLN`
                                    : "-"}
                                disabled
                            />
                            <input
                                type="hidden"
                                name="amount"
                                value={calculatedFuelAmount}
                            />
                        </div>

                        <div class="expenseField expenseFieldFull">
                            <label class="expenseLabel" for="fuel-description">
                                Description
                            </label>
                            <textarea
                                class="expenseTextarea"
                                id="fuel-description"
                                name="description"
                                bind:value={fuelExpenseDraft.description}
                            ></textarea>
                        </div>
                    </div>

                    <div class="expenseModalActions">
                        <button
                            type="button"
                            class="expenseGhostButton"
                            onclick={closeExpenseModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="expenseAddButton"
                            disabled={expenseSubmitting || !hasCarFuelType}
                        >
                            {expenseSubmitting
                                ? "Saving..."
                                : expenseModalMode === "create"
                                  ? "Create fuel expense"
                                  : "Update fuel expense"}
                        </button>
                    </div>
                </form>
            {:else}
                <form
                    method="POST"
                    action={
                        expenseModalMode === "create"
                            ? "?/createExpense"
                            : "?/updateExpense"
                    }
                    use:enhance={handleExpenseEnhance(
                        expenseModalMode === "create" ? "create" : "update",
                    )}
                >
                    <input type="hidden" name="category" value="maintenance" />
                    {#if expenseModalMode === "edit" && maintenanceExpenseDraft.expenseId}
                        <input
                            type="hidden"
                            name="expenseId"
                            value={maintenanceExpenseDraft.expenseId}
                        />
                    {/if}

                    <div class="expenseFormGrid">
                        <div class="expenseField">
                            <label class="expenseLabel" for="maintenance-amount">
                                Amount
                            </label>
                            <input
                                class="expenseInput"
                                id="maintenance-amount"
                                name="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                bind:value={maintenanceExpenseDraft.amount}
                            />
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="maintenance-date">
                                Date
                            </label>
                            <input
                                class="expenseInput"
                                id="maintenance-date"
                                name="date"
                                type="date"
                                required
                                bind:value={maintenanceExpenseDraft.date}
                            />
                        </div>

                        <div class="expenseField">
                            <label
                                class="expenseLabel"
                                for="maintenance-mileageAtExpense"
                            >
                                Mileage at expense
                            </label>
                            <input
                                class="expenseInput"
                                id="maintenance-mileageAtExpense"
                                name="mileageAtExpense"
                                type="number"
                                min="0"
                                bind:value={maintenanceExpenseDraft.mileageAtExpense}
                            />
                        </div>

                        <div class="expenseField">
                            <label class="expenseLabel" for="maintenanceType">
                                Maintenance type
                            </label>
                            <input
                                class="expenseInput"
                                id="maintenanceType"
                                name="maintenanceType"
                                bind:value={maintenanceExpenseDraft.maintenanceType}
                            />
                        </div>

                        <div class="expenseField expenseFieldFull">
                            <label
                                class="expenseLabel"
                                for="maintenance-description"
                            >
                                Description
                            </label>
                            <textarea
                                class="expenseTextarea"
                                id="maintenance-description"
                                name="description"
                                bind:value={maintenanceExpenseDraft.description}
                            ></textarea>
                        </div>
                    </div>

                    <div class="expenseModalActions">
                        <button
                            type="button"
                            class="expenseGhostButton"
                            onclick={closeExpenseModal}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="expenseAddButton"
                            disabled={expenseSubmitting}
                        >
                            {expenseSubmitting
                                ? "Saving..."
                                : expenseModalMode === "create"
                                  ? "Create maintenance expense"
                                  : "Update maintenance expense"}
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
{/if}
