<script lang="ts">
    import { enhance } from "$app/forms";
    import { invalidateAll } from "$app/navigation";
    import { fade, scale } from "svelte/transition";
    import { clickOutside } from "$lib/functions/clickOutside";
    import { createNewNotification } from "$lib/logic/notificationLogic.svelte";
    import {
        type Car,
        normalizeCarParameters,
        type CarParameters,
    } from "$lib/types/car";
    import type { ActionResult } from "@sveltejs/kit";

    interface Props {
        parameters?: CarParameters;
        open: boolean;
        onClose: () => void;
        action?: string;
        mode?: "create" | "edit";
        initialValues?: Partial<Car>;
    }

    const {
        parameters,
        open,
        onClose,
        action = "?/create",
        mode = "create",
        initialValues = {},
    }: Props = $props();

    const options = $derived(normalizeCarParameters(parameters));

    let submitting = $state(false);
    const isEditMode = $derived(mode === "edit");

    const modalTitle = $derived(isEditMode ? "Edit car" : "Add new car");
    const submitButtonLabel = $derived.by(() => {
        if (submitting) {
            return isEditMode ? "Updating..." : "Adding...";
        }
        return isEditMode ? "Update car" : "Add car";
    });

    function formatDateForInput(value?: string): string {
        if (!value) {
            return "";
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return value;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
            return "";
        }

        return parsed.toISOString().slice(0, 10);
    }

    function formatNumberForInput(value?: number): string {
        if (value === undefined || value === null || Number.isNaN(value)) {
            return "";
        }

        return String(value);
    }

    function handleEnhance() {
        submitting = true;

        return async ({ result }: { result: ActionResult }) => {
            submitting = false;

            if (result.type === "success") {
                const verb = isEditMode ? "updated" : "added";
                createNewNotification({
                    title: `Car ${verb}`,
                    message: `Your car has been ${verb} successfully`,
                    type: "success",
                    duration: 3000,
                });
                onClose();
                await invalidateAll();
                return;
            }

            if (result.type === "failure") {
                const verb = isEditMode ? "update" : "add";
                createNewNotification({
                    title: `Could not ${verb} car`,
                    message:
                        (result.data?.message as string) ??
                        "Something went wrong",
                    type: "error",
                    duration: 4000,
                });
            }
        };
    }
</script>

{#if open}
    <div class="addCarOverlay" transition:fade={{ duration: 150 }}>
        <div
            use:clickOutside
            onclick_outside={onClose}
            class="addCarModal"
            transition:scale={{ duration: 200, start: 0.95 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-car-title"
        >
            <header class="addCarHeader">
                <h2 id="add-car-title" class="addCarTitle">{modalTitle}</h2>
                <button
                    type="button"
                    onclick={onClose}
                    class="addCarCloseButton"
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 -960 960 960"
                    >
                        <path
                            d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"
                        />
                    </svg>
                </button>
            </header>

            <form
                method="POST"
                {action}
                use:enhance={handleEnhance}
                class="addCarForm"
            >
                <div class="addCarFormBody">
                    <fieldset disabled={submitting}>
                        <section class="addCarSection">
                            <h3 class="addCarSectionTitle">
                                Basic information
                            </h3>
                            <div class="addCarFieldGrid">
                                <div class="addCarField">
                                    <label class="addCarLabel" for="make"
                                        >Make</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="make"
                                        name="make"
                                        required
                                        placeholder="Toyota"
                                        value={initialValues.make ?? ""}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label class="addCarLabel" for="model"
                                        >Model</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="model"
                                        name="model"
                                        required
                                        placeholder="Camry"
                                        value={initialValues.model ?? ""}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label class="addCarLabel" for="year"
                                        >Year</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="year"
                                        name="year"
                                        type="number"
                                        min="1900"
                                        max="2100"
                                        placeholder="2022"
                                        value={formatNumberForInput(
                                            initialValues.year,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label class="addCarLabel" for="type"
                                        >Type</label
                                    >
                                    <select
                                        class="addCarSelect"
                                        id="type"
                                        name="type"
                                    >
                                        <option value="">Select type</option>
                                        {#each options.CarType as carType (carType)}
                                            <option
                                                value={carType}
                                                selected={
                                                    initialValues.type ===
                                                    carType
                                                }
                                            >
                                                {carType}
                                            </option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="addCarField">
                                    <label class="addCarLabel" for="color"
                                        >Color</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="color"
                                        name="color"
                                        placeholder="Black"
                                        value={initialValues.color ?? ""}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label class="addCarLabel" for="mileage"
                                        >Mileage (km)</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="mileage"
                                        name="mileage"
                                        type="number"
                                        min="0"
                                        placeholder="15000"
                                        value={formatNumberForInput(
                                            initialValues.mileage,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label class="addCarLabel" for="vin"
                                        >VIN</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="vin"
                                        name="vin"
                                        minlength="17"
                                        maxlength="17"
                                        pattern="[A-HJ-NPR-Z0-9]{17}"
                                        title="VIN must contain exactly 17 characters (A-H, J-N, P, R-Z and digits)."
                                        placeholder="1HGBH41JXMN109186"
                                        value={initialValues.vin ?? ""}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="registrationNumber"
                                        >License plate</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="registrationNumber"
                                        name="registrationNumber"
                                        placeholder="WA12345"
                                        value={
                                            initialValues.registrationNumber ??
                                            ""
                                        }
                                    />
                                </div>
                            </div>
                        </section>

                        <section class="addCarSection">
                            <h3 class="addCarSectionTitle">Engine</h3>
                            <div class="addCarFieldGrid">
                                <div class="addCarField">
                                    <label class="addCarLabel" for="engineType"
                                        >Fuel type</label
                                    >
                                    <select
                                        class="addCarSelect"
                                        id="engineType"
                                        name="engineType"
                                    >
                                        <option value="">Select fuel type</option>
                                        {#each options.FuelType as fuelType (fuelType)}
                                            <option
                                                value={fuelType}
                                                selected={
                                                    initialValues.engine
                                                        ?.type === fuelType
                                                }
                                            >
                                                {fuelType}
                                            </option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="engineDisplacement"
                                        >Displacement (L)</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="engineDisplacement"
                                        name="engineDisplacement"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder="2.5"
                                        value={formatNumberForInput(
                                            initialValues.engine
                                                ?.displacement,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="engineHorsepower"
                                        >Horsepower</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="engineHorsepower"
                                        name="engineHorsepower"
                                        type="number"
                                        min="0"
                                        placeholder="203"
                                        value={formatNumberForInput(
                                            initialValues.engine
                                                ?.horsepower,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="engineTorque"
                                        >Torque (Nm)</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="engineTorque"
                                        name="engineTorque"
                                        type="number"
                                        min="0"
                                        placeholder="250"
                                        value={formatNumberForInput(
                                            initialValues.engine?.torque,
                                        )}
                                    />
                                </div>
                            </div>
                        </section>

                        <section class="addCarSection">
                            <h3 class="addCarSectionTitle">Transmission</h3>
                            <div class="addCarFieldGrid">
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="transmissionType"
                                        >Type</label
                                    >
                                    <select
                                        class="addCarSelect"
                                        id="transmissionType"
                                        name="transmissionType"
                                    >
                                        <option value="">Select transmission</option>
                                        {#each options.TransmissionType as transmissionType (transmissionType)}
                                            <option
                                                value={transmissionType}
                                                selected={
                                                    initialValues
                                                        .transmission
                                                        ?.type ===
                                                    transmissionType
                                                }
                                            >
                                                {transmissionType}
                                            </option>
                                        {/each}
                                    </select>
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="transmissionGears"
                                        >Gears</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="transmissionGears"
                                        name="transmissionGears"
                                        type="number"
                                        min="1"
                                        placeholder="8"
                                        value={formatNumberForInput(
                                            initialValues.transmission
                                                ?.gears,
                                        )}
                                    />
                                </div>
                            </div>
                        </section>

                        <section class="addCarSection">
                            <h3 class="addCarSectionTitle">Dates</h3>
                            <div class="addCarFieldGrid">
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="manufactureDate"
                                        >Manufacture date</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="manufactureDate"
                                        name="manufactureDate"
                                        type="date"
                                        value={formatDateForInput(
                                            initialValues.dates
                                                ?.manufactureDate,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="registrationDate"
                                        >Registration date</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="registrationDate"
                                        name="registrationDate"
                                        type="date"
                                        value={formatDateForInput(
                                            initialValues.dates
                                                ?.registrationDate,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="insuranceExpiryDate"
                                        >Insurance expiry</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="insuranceExpiryDate"
                                        name="insuranceExpiryDate"
                                        type="date"
                                        value={formatDateForInput(
                                            initialValues.dates
                                                ?.insuranceExpiryDate,
                                        )}
                                    />
                                </div>
                                <div class="addCarField">
                                    <label
                                        class="addCarLabel"
                                        for="technicalInspectionExpiryDate"
                                        >Technical inspection expiry</label
                                    >
                                    <input
                                        class="addCarInput"
                                        id="technicalInspectionExpiryDate"
                                        name="technicalInspectionExpiryDate"
                                        type="date"
                                        value={formatDateForInput(
                                            initialValues.dates
                                                ?.technicalInspectionExpiryDate,
                                        )}
                                    />
                                </div>
                            </div>
                        </section>
                    </fieldset>
                </div>

                <footer class="addCarFooter">
                    <button
                        type="button"
                        onclick={onClose}
                        class="addCarCancelButton"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        class="addCarSubmitButton"
                    >
                        {submitButtonLabel}
                    </button>
                </footer>
            </form>
        </div>
    </div>
{/if}
