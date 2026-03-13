import type { CarType } from "$lib/types/carType";

export const checkCar = ( carData: CarType ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // VIN validation
    if (!carData.VIN || carData.VIN.trim() === "") {
        errors.push("VIN is required.");
    }

    if (carData.VIN && carData.VIN.length !== 17) {
        errors.push("VIN must be exactly 17 characters long.");
    }

    // Manufacturer validation
    if (!carData.manufacturer || carData.manufacturer.trim() === "") {
        errors.push("Manufacturer is required.");
    }

    // Model validation
    if (!carData.model || carData.model.trim() === "") {
        errors.push("Model is required.");
    }

    // Year validation
    const currentYear = new Date().getFullYear();

    if (carData.year === undefined || carData.year === null) {
        errors.push("Year is required.");
    } else if (typeof carData.year !== "number" || isNaN(carData.year)) {
        errors.push("Year must be a valid number.");
    } else if (carData.year < 1886 || carData.year > currentYear) {
        errors.push(`Year must be between 1886 and ${currentYear}.`);
    }

    // Mileage validation
    if (typeof carData.mileage !== "number" || isNaN(carData.mileage)) {
        errors.push("Mileage must be a valid number.");
    } else if (carData.mileage < 0) {
        errors.push("Mileage cannot be negative.");
    }

    // License Plate validation
    if (!carData.licensePlate || carData.licensePlate.trim() === "") {
        errors.push("License Plate is required.");
    }

   // Insurance Valid Until validation
    if (!carData.insuranceValidUntil) {
        errors.push("Insurance Valid Until date is required.");
    } else {
        const insuranceDate = new Date(carData.insuranceValidUntil);
        if (isNaN(insuranceDate.getTime())) {
            errors.push("Insurance Valid Until must be a valid date.");
        }
    }

    // Technical Inspection Valid Until validation
    if (!carData.technicalInspectionValidUntil) {
        errors.push("Technical Inspection Valid Until date is required.");
    } else {
        const inspectionDate = new Date(carData.technicalInspectionValidUntil);
        if (isNaN(inspectionDate.getTime())) {
            errors.push("Technical Inspection Valid Until must be a valid date.");
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}